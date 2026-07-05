"""
Views for the analysis app — Phase 3 Final.

Pipeline
--------
1. Collect real OSM features (FeatureCollector → Overpass API / cache)
2. Score with distance-enriched ScoringEngine (GeoFeature objects passed in)
3. ExplainabilityBuilder generates rich factor explanations
4. ConfidenceCalculator adds data-completeness confidence score
5. Persist result and return
"""

import logging

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsOwner
from .models import AnalysisRequest, AnalysisResult, WeightConfig
from .serializers import (
    AnalysisRequestSerializer,
    AnalysisResultSerializer,
    WeightConfigSerializer,
)

logger = logging.getLogger(__name__)


class AnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for analysis requests.
    Supports: list, create, retrieve, destroy.
    Update is not supported — analysis results are immutable once computed.
    """

    serializer_class = AnalysisRequestSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwner)
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        """Always scoped to the current user."""
        return (
            AnalysisRequest.objects
            .filter(user=self.request.user)
            .select_related("result")
            .order_by("-created_at")
        )

    def create(self, request, *args, **kwargs):
        """
        Submit a new analysis request.

        Phase 3.2: Calls FeatureCollector for real OSM data.
        Phase 5+:  Will replace mock scoring with real scoring engine.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        analysis_request = serializer.save()

        self._run_analysis(analysis_request)

        return Response(
            self.get_serializer(analysis_request).data,
            status=status.HTTP_201_CREATED,
        )

    # ── Core analysis pipeline ────────────────────────────────────────────────

    def _run_analysis(self, analysis_request: AnalysisRequest) -> None:
        """
        Phase 3 Final pipeline:
          1. Collect real OSM features (returns FeatureResult with GeoFeature objects).
          2. Score using distance-enriched ScoringEngine (nearby = weighted more).
          3. Persist result with confidence, distance metrics, road hierarchy, etc.
        """
        lat      = float(analysis_request.latitude)
        lon      = float(analysis_request.longitude)
        radius_m = analysis_request.radius_m

        # ── Step 1: Collect real OSM features (full FeatureResult) ────────────
        osm_snapshot, feature_result = self._collect_osm_features(lat, lon, radius_m)

        # ── Step 2: Distance-enriched scoring ─────────────────────────────────
        feature_counts = osm_snapshot.get("feature_counts", {})
        score, breakdown, raw_factors = self._score(
            feature_counts=feature_counts,
            business_type=analysis_request.business_type,
            lat=lat, lon=lon, radius_m=radius_m,
            feature_result=feature_result,
        )

        # ── Step 3: Persist result ────────────────────────────────────────────
        osm_error = osm_snapshot.get("osm_error")
        insights  = self._build_insights(osm_snapshot, osm_error, raw_factors)
        recs      = self._build_recommendations(osm_snapshot, raw_factors)

        AnalysisResult.objects.create(
            request=analysis_request,
            site_readiness_score=score,
            score_breakdown=breakdown,
            osm_data_snapshot=osm_snapshot,
            ai_insights=insights,
            recommendations=recs,
            raw_factors=raw_factors,
        )
        analysis_request.status       = AnalysisRequest.Status.COMPLETED
        analysis_request.completed_at = timezone.now()
        analysis_request.save(update_fields=["status", "completed_at"])

        logger.info(
            "Analysis complete: request=%s lat=%.4f lon=%.4f score=%.1f "
            "total_features=%d confidence=%.0f osm_error=%s",
            analysis_request.id, lat, lon, score,
            osm_snapshot.get("total_features", 0),
            raw_factors.get("_meta", {}).get("confidence", {}).get("score", 0),
            osm_error,
        )

    # ── OSM collection ────────────────────────────────────────────────────────

    @staticmethod
    def _collect_osm_features(lat: float, lon: float, radius_m: int):
        """
        Call FeatureCollector and return (osm_snapshot_dict, feature_result).

        osm_snapshot: plain dict → stored in osm_data_snapshot DB field.
        feature_result: FeatureResult → passed to ScoringEngine for distance enrichment.
        Returns (snapshot, None) on any unexpected error.
        """
        try:
            from intelligence.geo import FeatureCollector

            collector      = FeatureCollector()
            result         = collector.collect(lat=lat, lon=lon, radius_m=radius_m)

            feature_counts = {cat: len(feats) for cat, feats in result.features.items()}
            feature_details = {
                cat: [f.name for f in feats if f.name][:5]
                for cat, feats in result.features.items()
            }

            snapshot = {
                "feature_counts":  feature_counts,
                "feature_details": feature_details,
                "total_features":  result.total,
                "source":          result.source,
                "query_time_ms":   round(result.query_time_ms, 1),
                "radius_m":        radius_m,
                "osm_error":       result.error,
            }
            return snapshot, result  # <-- full FeatureResult for distance enrichment

        except Exception as exc:
            logger.error("FeatureCollector raised unexpectedly: %s", exc, exc_info=True)
            snapshot = {
                "feature_counts":  {},
                "feature_details": {},
                "total_features":  0,
                "source":          "error",
                "query_time_ms":   0,
                "radius_m":        radius_m,
                "osm_error":       str(exc),
            }
            return snapshot, None

    # ── Real scoring via ScoringEngine ─────────────────────────────────────

    @staticmethod
    def _score(
        feature_counts: dict,
        business_type: str,
        lat: float = 0.0,
        lon: float = 0.0,
        radius_m: int = 1000,
        feature_result=None,   # intelligence.geo.types.FeatureResult | None
    ) -> tuple[float, dict, dict]:
        """
        Phase 3 Final: Distance-enriched rule-based scoring.
        Passes full FeatureResult to ScoringEngine for distance weighting.
        Returns (overall_score, score_breakdown, raw_factors).
        Never raises — returns neutral 50 scores on any unexpected error.
        """
        try:
            from intelligence.scoring import ScoringEngine
            engine = ScoringEngine()
            result = engine.calculate(
                feature_counts=feature_counts,
                business_type=business_type,
                lat=lat, lon=lon, radius_m=radius_m,
                feature_result=feature_result,   # <-- Phase 3 Final
            )
            return (
                result.overall,
                result.to_score_breakdown(),
                result.to_raw_factors(),
            )
        except Exception as exc:
            logger.error("ScoringEngine raised: %s", exc, exc_info=True)
            neutral = {"accessibility": 50.0, "infrastructure": 50.0,
                       "commercial": 50.0, "competition": 50.0, "environment": 50.0}
            return 50.0, neutral, {}

    # ── Insight / recommendation builders ────────────────────────────────────

    @staticmethod
    def _build_insights(osm_snapshot: dict, osm_error: str | None, raw_factors: dict = None) -> list:
        counts  = osm_snapshot.get("feature_counts", {})
        total   = osm_snapshot.get("total_features", 0)
        source  = osm_snapshot.get("source", "unknown")
        meta    = (raw_factors or {}).get("_meta", {})
        conf    = meta.get("confidence", {})
        rh      = meta.get("road_hierarchy", {})

        if osm_error:
            return [{
                "type":        "warning",
                "title":       "Geospatial Data Unavailable",
                "description": (
                    "Could not retrieve OpenStreetMap data for this location. "
                    "Scores are based on limited data."
                ),
                "priority": 1,
            }]

        insights = [{
            "type":  "info",
            "title": "Distance-Weighted Analysis Active",
            "description": (
                f"Analysis based on {total} OSM features ({source}). "
                f"Nearby features weighted more than distant ones. "
                f"Confidence: {conf.get('label', 'N/A')} ({conf.get('score', 0):.0f}%)."
            ),
            "priority": 1,
        }]

        # Road quality insight
        if rh.get("road_quality_label") in ("Excellent", "Good"):
            insights.append({
                "type":  "info",
                "title": f"{rh['road_quality_label']} Road Connectivity",
                "description": (
                    f"{rh.get('high_quality_count', 0)} major road(s) detected. "
                    f"Dominant type: {rh.get('dominant_type', 'unknown')}. "
                    f"Road quality score: {rh.get('quality_score', 0):.0f}/100."
                ),
                "priority": 2,
            })

        restaurants = counts.get("restaurants", 0)
        if restaurants > 50:
            insights.append({
                "type":  "info",
                "title": "High Dining Density",
                "description": (
                    f"Found {restaurants} restaurants/cafes — strong indicator "
                    "of foot traffic and commercial activity."
                ),
                "priority": 3,
            })

        if counts.get("bus_stops", 0) == 0:
            insights.append({
                "type":  "warning",
                "title": "Limited Public Transit",
                "description": (
                    "No bus stops detected. This may reduce accessibility "
                    "for staff and customers."
                ),
                "priority": 4,
            })

        return insights

    @staticmethod
    def _build_recommendations(osm_snapshot: dict, raw_factors: dict = None) -> list:
        counts = osm_snapshot.get("feature_counts", {})
        meta   = (raw_factors or {}).get("_meta", {})
        dm     = meta.get("distance_metrics", {})

        if not counts:
            return [{
                "action":    "Re-run analysis when OSM data is available",
                "rationale": "Feature counts could not be retrieved from Overpass",
                "impact":    "high",
            }]

        recs = []
        if counts.get("hospitals", 0) == 0:
            recs.append({
                "action":    "Evaluate proximity to medical facilities",
                "rationale": "No hospitals detected in the search radius",
                "impact":    "medium",
            })

        hosp_nearest = dm.get("hospitals", {}).get("nearest_distance")
        if hosp_nearest and hosp_nearest > 500:
            recs.append({
                "action":    f"Verify emergency access routes",
                "rationale": f"Nearest hospital is {hosp_nearest:.0f}m away",
                "impact":    "medium",
            })

        if counts.get("bus_stops", 0) < 3:
            recs.append({
                "action":    "Assess public transit accessibility",
                "rationale": "Fewer than 3 bus stops in the area",
                "impact":    "medium",
            })
        if counts.get("parks", 0) > 2:
            recs.append({
                "action":    "Highlight proximity to green space in marketing",
                "rationale": f"{counts.get('parks', 0)} parks detected nearby",
                "impact":    "low",
            })
        if not recs:
            recs.append({
                "action":    "Proceed with detailed site survey",
                "rationale": "Feature density and distribution look suitable",
                "impact":    "medium",
            })
        return recs

    # ── Detail action ─────────────────────────────────────────────────────────

    @action(detail=True, methods=["get"], url_path="result")
    def result(self, request, pk=None):
        """GET /analysis/{id}/result/ — Return only the result object."""
        analysis_request = self.get_object()
        if not hasattr(analysis_request, "result"):
            return Response(
                {"message": "Analysis result not yet available."},
                status=status.HTTP_202_ACCEPTED,
            )
        return Response(AnalysisResultSerializer(analysis_request.result).data)


class WeightConfigViewSet(viewsets.ModelViewSet):
    """CRUD for custom weight configurations."""

    serializer_class = WeightConfigSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return WeightConfig.objects.filter(is_default=True) | WeightConfig.objects.filter(
            created_by=self.request.user
        )
