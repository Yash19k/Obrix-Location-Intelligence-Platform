"""
Views for the analysis app.

Phase 3.2: Real OSM feature collection via FeatureCollector.
The scoring engine still uses mock values (Phase 5 will replace with real scoring).
The osm_data_snapshot now stores actual feature counts from Overpass.
"""

import logging
import random

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
        Phase 3.2 pipeline:
          1. Collect real OSM features via FeatureCollector (Overpass API).
          2. Store feature counts in osm_data_snapshot.
          3. Mock scoring (still Phase 4 placeholder — Phase 5 uses real engine).

        Overpass errors are caught internally by FeatureCollector and stored
        in osm_data_snapshot.osm_error — they never cause the endpoint to fail.
        """
        lat      = float(analysis_request.latitude)
        lon      = float(analysis_request.longitude)
        radius_m = analysis_request.radius_m

        # ── Step 1: Collect real OSM features ────────────────────────────────
        osm_snapshot = self._collect_osm_features(lat, lon, radius_m)

        # ── Step 2: Score from real feature counts ────────────────────────────
        feature_counts = osm_snapshot.get("feature_counts", {})
        score, breakdown, raw_factors = self._score(
            feature_counts=feature_counts,
            business_type=analysis_request.business_type,
            lat=lat, lon=lon, radius_m=radius_m,
        )

        # ── Step 3: Persist result ────────────────────────────────────────────
        osm_error = osm_snapshot.get("osm_error")
        insights  = self._build_insights(osm_snapshot, osm_error)
        recs      = self._build_recommendations(osm_snapshot)

        AnalysisResult.objects.create(
            request=analysis_request,
            site_readiness_score=score,
            score_breakdown=breakdown,
            osm_data_snapshot=osm_snapshot,
            ai_insights=insights,
            recommendations=recs,
            raw_factors=raw_factors,
        )
        analysis_request.status    = AnalysisRequest.Status.COMPLETED
        analysis_request.completed_at = timezone.now()
        analysis_request.save(update_fields=["status", "completed_at"])

        logger.info(
            "Analysis complete: request=%s lat=%.4f lon=%.4f score=%.1f "
            "total_features=%d osm_error=%s",
            analysis_request.id, lat, lon, score,
            osm_snapshot.get("total_features", 0), osm_error,
        )

    # ── OSM collection ────────────────────────────────────────────────────────

    @staticmethod
    def _collect_osm_features(lat: float, lon: float, radius_m: int) -> dict:
        """
        Call FeatureCollector and return a plain dict suitable for
        storing in osm_data_snapshot.

        Always returns a valid dict — Overpass failures are captured in
        the 'osm_error' key without raising.
        """
        try:
            from intelligence.geo import FeatureCollector

            collector = FeatureCollector()
            result    = collector.collect(lat=lat, lon=lon, radius_m=radius_m)

            feature_counts = {
                cat: len(feats)
                for cat, feats in result.features.items()
            }
            # Store top-2 named features per category for display
            feature_details = {}
            for cat, feats in result.features.items():
                named = [f.name for f in feats if f.name][:5]
                feature_details[cat] = named

            return {
                "feature_counts":   feature_counts,
                "feature_details":  feature_details,
                "total_features":   result.total,
                "source":           result.source,
                "query_time_ms":    round(result.query_time_ms, 1),
                "radius_m":         radius_m,
                "osm_error":        result.error,   # None if successful
            }

        except Exception as exc:
            logger.error("FeatureCollector raised unexpectedly: %s", exc, exc_info=True)
            return {
                "feature_counts":  {},
                "feature_details": {},
                "total_features":  0,
                "source":          "error",
                "query_time_ms":   0,
                "radius_m":        radius_m,
                "osm_error":       str(exc),
            }

    # ── Real scoring via ScoringEngine ─────────────────────────────────────

    @staticmethod
    def _score(
        feature_counts: dict,
        business_type: str,
        lat: float = 0.0,
        lon: float = 0.0,
        radius_m: int = 1000,
    ) -> tuple[float, dict, dict]:
        """
        Phase 3.3: Real rule-based scoring engine.
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
    def _build_insights(osm_snapshot: dict, osm_error: str | None) -> list:
        counts = osm_snapshot.get("feature_counts", {})
        total  = osm_snapshot.get("total_features", 0)
        source = osm_snapshot.get("source", "unknown")

        if osm_error:
            return [{
                "type":        "warning",
                "title":       "Geospatial Data Unavailable",
                "description": (
                    "Could not retrieve OpenStreetMap data for this location. "
                    "Scores are based on mock values only."
                ),
                "priority": 1,
            }]

        insights = [{
            "type":  "info",
            "title": "Real OpenStreetMap Data",
            "description": (
                f"Analysis based on {total} features retrieved from "
                f"OpenStreetMap via Overpass API ({source}). "
                f"Scoring engine will be activated in Phase 5."
            ),
            "priority": 1,
        }]

        # Contextual insight based on feature density
        restaurants = counts.get("restaurants", 0)
        if restaurants > 50:
            insights.append({
                "type":  "info",
                "title": "High Dining Density",
                "description": (
                    f"Found {restaurants} restaurants/cafes nearby — strong "
                    "indicator of foot traffic and commercial activity."
                ),
                "priority": 2,
            })

        banks = counts.get("banks", 0)
        if banks > 10:
            insights.append({
                "type":  "info",
                "title": "Strong Financial Presence",
                "description": (
                    f"{banks} banks/ATMs detected — signals an established "
                    "commercial zone."
                ),
                "priority": 3,
            })

        bus_stops = counts.get("bus_stops", 0)
        if bus_stops == 0:
            insights.append({
                "type":  "warning",
                "title": "Limited Public Transit",
                "description": (
                    "No bus stops detected within the search radius. "
                    "This may reduce accessibility for staff and customers."
                ),
                "priority": 4,
            })

        return insights

    @staticmethod
    def _build_recommendations(osm_snapshot: dict) -> list:
        counts = osm_snapshot.get("feature_counts", {})
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
                "rationale": "Feature density looks suitable for the location",
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
