"""
intelligence/scoring/factors/infrastructure.py

Infrastructure factor — Phase 3 Final.

Changes from Phase 3.3:
  - Log normalization throughout
  - Distance-weighted counts via _get_weighted_count()
  - Nearest-distance metadata for hospitals and schools
  - Explanation delegated to ExplainabilityBuilder
"""

from __future__ import annotations

from .base import AbstractFactor
from intelligence.scoring.normalization import log_normalize, clamp
from intelligence.scoring.config import FACTOR_THRESHOLDS


class InfrastructureFactor(AbstractFactor):
    """Scores based on density of hospitals, schools, banks, fuel stations."""

    key = "infrastructure"

    def compute(self) -> tuple[float, dict]:
        cfg = FACTOR_THRESHOLDS["infrastructure"]

        # Distance-weighted counts (fall back to raw count when not enriched)
        hospitals     = self._get_weighted_count("hospitals")
        schools       = self._get_weighted_count("schools")
        banks         = self._get_weighted_count("banks")
        fuel_stations = self._get_weighted_count("fuel_stations")

        hosp_score = log_normalize(hospitals,     cfg["hospitals_saturation"])
        sch_score  = log_normalize(schools,       cfg["schools_saturation"])
        bank_score = log_normalize(banks,         cfg["banks_saturation"])
        fuel_score = log_normalize(fuel_stations, cfg["fuel_stations_saturation"])

        score = clamp(
            cfg["hospitals_weight"]     * hosp_score +
            cfg["schools_weight"]       * sch_score  +
            cfg["banks_weight"]         * bank_score +
            cfg["fuel_stations_weight"] * fuel_score
        )

        raw = {
            "key":   self.key,
            "label": "Infrastructure",
            "score": round(score, 2),
            "inputs": {
                "hospitals":     self._get_count("hospitals"),
                "schools":       self._get_count("schools"),
                "banks":         self._get_count("banks"),
                "fuel_stations": self._get_count("fuel_stations"),
            },
            "sub_scores": {
                "hospitals":     round(hosp_score, 2),
                "schools":       round(sch_score,  2),
                "banks":         round(bank_score, 2),
                "fuel_stations": round(fuel_score, 2),
            },
            "nearest_distance": {
                "hospitals":     self._get_nearest_distance("hospitals"),
                "schools":       self._get_nearest_distance("schools"),
                "banks":         self._get_nearest_distance("banks"),
                "fuel_stations": self._get_nearest_distance("fuel_stations"),
            },
            "avg_distance": {
                "hospitals": self._get_avg_distance("hospitals"),
                "schools":   self._get_avg_distance("schools"),
            },
            "density": {
                "hospitals":     self._get_density("hospitals"),
                "schools":       self._get_density("schools"),
                "banks":         self._get_density("banks"),
                "fuel_stations": self._get_density("fuel_stations"),
            },
        }
        return score, raw
