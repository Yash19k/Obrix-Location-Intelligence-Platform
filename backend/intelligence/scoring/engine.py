"""
intelligence/scoring/engine.py

ScoringEngine — Phase 3 Final orchestrator.

What changed from Phase 3.3
---------------------------
- _enrich(): pre-computes per-category {count, weighted_count, density,
  nearest_distance, avg_distance, features[]} from GeoFeature objects
- All factors receive enriched data automatically → distance-weighted scoring
- ExplainabilityBuilder generates rich explanations (separate from factors)
- ConfidenceCalculator adds a confidence score to every result
- Road hierarchy, density metrics, competition metrics computed once and reused
- ScoreResult carries the extended metrics for the API response

Backward compatibility
----------------------
- calculate(feature_counts, business_type) still works (count-only mode)
- Pass feature_result=<FeatureResult> to activate distance-enriched mode
"""

from __future__ import annotations

import logging
from typing import Any

from .config import get_weight_profile
from .types  import FactorScore, ScoreResult
from .factors.accessibility  import AccessibilityFactor
from .factors.infrastructure  import InfrastructureFactor
from .factors.commercial      import CommercialFactor
from .factors.competition     import CompetitionFactor
from .factors.environment     import EnvironmentFactor
from .explainability  import ExplainabilityBuilder
from .confidence      import ConfidenceCalculator
from .services.distance   import get_distance_service
from .services.density    import DensityService
from .services.roads      import RoadService
from .services.competition import CompetitionService

logger = logging.getLogger(__name__)

_FACTOR_ORDER = [
    AccessibilityFactor,
    InfrastructureFactor,
    CommercialFactor,
    CompetitionFactor,
    EnvironmentFactor,
]


class ScoringEngine:
    """
    Phase 3 Final scoring engine.

    Usage (count-only, backwards compat)
    -------------------------------------
        engine = ScoringEngine()
        result = engine.calculate(feature_counts={"roads": 84, ...}, business_type="retail")

    Usage (enriched, with GeoFeature objects)
    ------------------------------------------
        result = engine.calculate(
            feature_counts=...,
            business_type="retail",
            feature_result=<FeatureResult>,
        )

    result.overall                    → float 0-100
    result.confidence                 → {score, label, penalties}
    result.distance_metrics           → {category: {nearest, avg}}
    result.density_metrics            → {category: features/km²}
    result.road_hierarchy             → road type breakdown + quality
    result.competition_metrics        → competitor count + breakdown
    result.to_score_breakdown()       → {factor_key: score}   (DB field)
    result.to_raw_factors()           → full detail + _meta    (DB field)
    """

    def calculate(
        self,
        feature_counts: dict[str, int],
        business_type:  str  = "generic",
        lat:            float = 0.0,
        lon:            float = 0.0,
        radius_m:       int   = 1000,
        feature_result: Any   = None,   # intelligence.geo.types.FeatureResult | None
    ) -> ScoreResult:
        """
        Run all factor modules and produce a ScoreResult.

        When feature_result is provided, the engine:
          1. Enriches data with distance weights and density
          2. Computes road hierarchy, distance metrics, competition metrics
          3. Builds rich explanations via ExplainabilityBuilder
          4. Computes confidence score via ConfidenceCalculator

        When feature_result is None (count-only mode), factors receive plain
        count dicts and the result has empty extended metric fields.
        """
        weights    = get_weight_profile(business_type)
        dist_svc   = get_distance_service()
        dens_svc   = DensityService()
        is_enriched = feature_result is not None

        # ── Step 1: Build enriched osm_data dict ─────────────────────────────
        if is_enriched:
            osm_data, extended = self._enrich(
                feature_result, lat, lon, radius_m, business_type,
                dist_svc, dens_svc,
            )
        else:
            osm_data  = feature_counts  # plain count dict
            extended  = self._empty_extended()

        # ── Step 2: Build ExplainabilityBuilder context ───────────────────────
        builder = ExplainabilityBuilder({
            "lat":                lat,
            "lon":                lon,
            "radius_m":           radius_m,
            "business_type":      business_type,
            "density_metrics":    extended["density_metrics"],
            "distance_metrics":   extended["distance_metrics"],
            "road_hierarchy":     extended["road_hierarchy"],
            "competition_metrics":extended["competition_metrics"],
        })

        # ── Step 3: Compute each factor ───────────────────────────────────────
        factors: dict[str, FactorScore] = {}

        for FactorClass in _FACTOR_ORDER:
            kwargs = {"lat": lat, "lon": lon, "radius_m": radius_m, "osm_data": osm_data}
            if FactorClass is CompetitionFactor:
                kwargs["business_type"] = business_type

            try:
                instance = FactorClass(**kwargs)
                score, raw = instance.compute()
                explanation = builder.build(instance.key, raw)

                factors[instance.key] = FactorScore(
                    key         = raw["key"],
                    label       = raw["label"],
                    score       = raw["score"],
                    explanation = explanation,
                    inputs      = raw.get("inputs",     {}),
                    sub_scores  = raw.get("sub_scores", {}),
                )
            except Exception as exc:
                logger.error("Factor %s failed: %s", FactorClass.__name__, exc, exc_info=True)
                factors[getattr(FactorClass, "key", "unknown")] = FactorScore(
                    key="unknown", label="Unknown", score=50.0,
                    explanation="Factor computation failed — using neutral score.",
                    inputs={}, sub_scores={},
                )

        # ── Step 4: Weighted overall score ────────────────────────────────────
        total_w = sum(weights.get(k, 0.0) for k in factors)
        if total_w > 0:
            overall = round(
                sum(factors[k].score * weights.get(k, 0.0) for k in factors) / total_w, 2
            )
        else:
            overall = round(sum(f.score for f in factors.values()) / len(factors), 2)

        # ── Step 5: Confidence ────────────────────────────────────────────────
        plain_counts = (
            {cat: d["count"] for cat, d in osm_data.items() if isinstance(d, dict)}
            if is_enriched else feature_counts
        )
        confidence = ConfidenceCalculator.calculate(
            feature_counts  = plain_counts,
            osm_error       = getattr(feature_result, "error", None),
            total_features  = getattr(feature_result, "total", sum(plain_counts.values())),
            is_enriched     = is_enriched,
            osm_source      = getattr(feature_result, "source", "overpass"),
        )

        logger.info(
            "ScoringEngine: type=%s overall=%.1f conf=%.0f%% enriched=%s [%s]",
            business_type, overall, confidence["score"], is_enriched,
            " | ".join(f"{k}={v.score:.1f}" for k, v in factors.items()),
        )

        return ScoreResult(
            overall             = overall,
            factors             = factors,
            weights_used        = {k: weights.get(k, 0.0) for k in factors},
            business_type       = business_type,
            confidence          = confidence,
            distance_metrics    = extended["distance_metrics"],
            density_metrics     = extended["density_metrics"],
            road_hierarchy      = extended["road_hierarchy"],
            competition_metrics = extended["competition_metrics"],
            normalization_metadata = {
                "method":         "logarithmic",
                "decay_rate":     3.0,
                "radius_m":       radius_m,
                "is_enriched":    is_enriched,
            },
        )

    # ── Private helpers ───────────────────────────────────────────────────────

    def _enrich(
        self,
        feature_result: Any,
        lat:   float,
        lon:   float,
        radius_m: float,
        business_type: str,
        dist_svc: Any,
        dens_svc: DensityService,
    ) -> tuple[dict, dict]:
        """
        Pre-compute per-category enriched data and extended metrics.

        Returns (enriched_osm_data, extended_metrics_dict).
        enriched_osm_data replaces the plain feature_counts dict passed to factors.
        """
        features_by_cat: dict = feature_result.features  # dict[str, list[GeoFeature]]

        enriched: dict[str, dict] = {}
        distance_metrics: dict    = {}
        density_metrics:  dict    = {}

        for cat, feats in features_by_cat.items():
            count          = len(feats)
            weighted_count = dist_svc.weighted_count(feats, lat, lon, radius_m)
            density        = dens_svc.density(count, radius_m)
            nearest        = dist_svc.nearest(feats, lat, lon)
            avg            = dist_svc.average(feats, lat, lon)

            enriched[cat] = {
                "count":           count,
                "features":        feats,
                "weighted_count":  weighted_count,
                "density":         density,
                "nearest_distance":nearest,
                "avg_distance":    avg,
            }
            distance_metrics[cat] = {
                "nearest_distance": nearest,
                "avg_distance":     avg,
                "count":            count,
            }
            density_metrics[cat] = density

        # Road hierarchy (computed once, shared)
        road_hierarchy = RoadService.analyse(
            features_by_cat.get("roads", []), lat, lon, radius_m, dist_svc,
        )

        # Competition metrics
        competition_metrics = CompetitionService.detect(
            features_by_cat, business_type, lat, lon, radius_m, dist_svc,
        )

        extended = {
            "distance_metrics":    distance_metrics,
            "density_metrics":     density_metrics,
            "road_hierarchy":      road_hierarchy,
            "competition_metrics": competition_metrics,
        }
        return enriched, extended

    @staticmethod
    def _empty_extended() -> dict:
        return {
            "distance_metrics":    {},
            "density_metrics":     {},
            "road_hierarchy":      {},
            "competition_metrics": {},
        }
