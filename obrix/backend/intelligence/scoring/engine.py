"""
Scoring Engine — orchestrates all factor modules into a final Site Readiness Score.

Design pattern: Strategy + Chain of Responsibility.
Each factor is an independent module implementing AbstractFactor.compute().
The engine collects scores and applies weighted summation.

This module has ZERO Django imports — it's a pure Python service.
"""

from typing import Dict
from .factors.accessibility import AccessibilityFactor
from .factors.population import PopulationFactor
from .factors.competition import CompetitionFactor
from .factors.infrastructure import InfrastructureFactor
from .factors.land_use import LandUseFactor
from .weights import get_weights


class ScoringEngine:
    """
    Orchestrates geospatial factor analysis and produces a Site Readiness Score.

    Usage:
        engine = ScoringEngine()
        result = engine.run(lat=28.6139, lon=77.2090, radius_m=1000, business_type="retail")
    """

    # Register all factor modules in order
    FACTORS = [
        AccessibilityFactor,
        PopulationFactor,
        CompetitionFactor,
        InfrastructureFactor,
        LandUseFactor,
    ]

    def run(
        self,
        lat: float,
        lon: float,
        radius_m: int = 1000,
        business_type: str = "generic",
        osm_data: dict = None,
    ) -> Dict:
        """
        Run all factor modules and return the aggregated score.

        Args:
            lat: Latitude of the analysis point
            lon: Longitude of the analysis point
            radius_m: Analysis radius in meters
            business_type: Business type key for weight lookup
            osm_data: Pre-fetched OSM data (if None, stub data used in Phase 4)

        Returns:
            {
                "site_readiness_score": 72.4,
                "score_breakdown": {"accessibility": 85.0, ...},
                "raw_factors": {...},
            }
        """
        weights = get_weights(business_type)
        score_breakdown = {}
        raw_factors = {}

        for FactorClass in self.FACTORS:
            factor = FactorClass(lat=lat, lon=lon, radius_m=radius_m, osm_data=osm_data or {})
            factor_key = factor.key
            score, raw = factor.compute()
            score_breakdown[factor_key] = round(score, 2)
            raw_factors[factor_key] = raw

        # Weighted sum
        total_weight = sum(weights.get(k, 0) for k in score_breakdown)
        site_readiness_score = sum(
            score_breakdown[k] * weights.get(k, 0)
            for k in score_breakdown
        )
        if total_weight > 0:
            site_readiness_score = round(site_readiness_score / total_weight, 2)

        return {
            "site_readiness_score": site_readiness_score,
            "score_breakdown": score_breakdown,
            "raw_factors": raw_factors,
        }
