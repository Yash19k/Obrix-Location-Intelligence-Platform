"""
intelligence/scoring/engine.py

ScoringEngine — orchestrates all factor modules into a final Site Readiness Score.

Phase 3.3: All five factors implemented with real OSM feature counts.
Phase 5+: Individual factors can be replaced with ML models without changing
          the engine interface or the views layer.

Zero Django imports — pure Python service.
"""

from __future__ import annotations

import logging
from typing import Any

from .config import get_weight_profile
from .types import FactorScore, ScoreResult
from .factors.accessibility  import AccessibilityFactor
from .factors.infrastructure  import InfrastructureFactor
from .factors.commercial      import CommercialFactor
from .factors.competition     import CompetitionFactor
from .factors.environment     import EnvironmentFactor

logger = logging.getLogger(__name__)


class ScoringEngine:
    """
    Orchestrates geospatial factor analysis and produces a Site Readiness Score.

    Usage
    -----
    engine = ScoringEngine()
    result = engine.calculate(feature_counts, business_type="retail")

    result.overall            # float 0–100
    result.factors            # dict[str, FactorScore]
    result.to_score_breakdown()   # {factor_key: score}  → score_breakdown DB field
    result.to_raw_factors()       # full detail           → raw_factors DB field

    Swapping a factor (e.g. Phase 5 ML model for accessibility)
    -----------------------------------------------------------
    Replace AccessibilityFactor with any object that has:
        key: str
        compute() -> (float, dict)
    No other change required.
    """

    def calculate(
        self,
        feature_counts: dict[str, int],
        business_type:  str = "generic",
        lat:            float = 0.0,
        lon:            float = 0.0,
        radius_m:       int   = 1000,
    ) -> ScoreResult:
        """
        Run all factor modules against the provided feature counts.

        Parameters
        ----------
        feature_counts : dict
            Output of FeatureCollector.collect().features mapped to counts.
            Example: {"roads": 84, "hospitals": 2, "restaurants": 148, ...}
        business_type : str
            Used to select weight profile and competition rules.
        lat, lon, radius_m : float, float, int
            Passed to factor constructors (used by future ML factors).

        Returns
        -------
        ScoreResult
        """
        weights = get_weight_profile(business_type)

        # ── Instantiate and compute each factor ───────────────────────────────
        factor_instances = [
            AccessibilityFactor(
                lat=lat, lon=lon, radius_m=radius_m, osm_data=feature_counts
            ),
            InfrastructureFactor(
                lat=lat, lon=lon, radius_m=radius_m, osm_data=feature_counts
            ),
            CommercialFactor(
                lat=lat, lon=lon, radius_m=radius_m, osm_data=feature_counts
            ),
            CompetitionFactor(
                lat=lat, lon=lon, radius_m=radius_m,
                osm_data=feature_counts, business_type=business_type
            ),
            EnvironmentFactor(
                lat=lat, lon=lon, radius_m=radius_m, osm_data=feature_counts
            ),
        ]

        factors: dict[str, FactorScore] = {}

        for instance in factor_instances:
            try:
                score, raw = instance.compute()
                factors[instance.key] = FactorScore(
                    key         = raw["key"],
                    label       = raw["label"],
                    score       = raw["score"],
                    explanation = raw["explanation"],
                    inputs      = raw.get("inputs",     {}),
                    sub_scores  = raw.get("sub_scores", {}),
                )
            except Exception as exc:
                logger.error(
                    "Factor %s raised: %s", instance.key, exc, exc_info=True
                )
                # Graceful degradation — factor fails silently with neutral score
                factors[instance.key] = FactorScore(
                    key         = instance.key,
                    label       = instance.key.replace("_", " ").title(),
                    score       = 50.0,
                    explanation = f"Score unavailable — factor encountered an error.",
                    inputs      = {},
                    sub_scores  = {},
                )

        # ── Weighted sum ──────────────────────────────────────────────────────
        total_weight = sum(weights.get(k, 0.0) for k in factors)
        if total_weight > 0:
            weighted_sum = sum(
                factors[k].score * weights.get(k, 0.0) for k in factors
            )
            overall = round(weighted_sum / total_weight, 2)
        else:
            # Fallback: simple average
            overall = round(sum(f.score for f in factors.values()) / len(factors), 2)

        logger.info(
            "ScoringEngine: business_type=%s overall=%.1f "
            "[%s]",
            business_type, overall,
            " | ".join(f"{k}={v.score:.1f}" for k, v in factors.items()),
        )

        return ScoreResult(
            overall       = overall,
            factors       = factors,
            weights_used  = {k: weights.get(k, 0.0) for k in factors},
            business_type = business_type,
        )
