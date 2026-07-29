"""
intelligence/scoring/factors/commercial.py

Commercial Activity factor — Phase 3 Final.

Changes from Phase 3.3:
  - Density-aware scoring (restaurants/km² not raw count)
  - Log normalization
  - Distance-weighted counts
"""

from __future__ import annotations

from .base import AbstractFactor
from intelligence.scoring.normalization import log_normalize, clamp
from intelligence.scoring.config import FACTOR_THRESHOLDS, DENSITY_THRESHOLDS


class CommercialFactor(AbstractFactor):
    """Scores location based on dining density and financial services presence."""

    key = "commercial"

    def compute(self) -> tuple[float, dict]:
        cfg  = FACTOR_THRESHOLDS["commercial"]
        dens = DENSITY_THRESHOLDS

        # Distance-weighted counts (falls back to raw count)
        restaurants = self._get_weighted_count("restaurants")
        banks       = self._get_weighted_count("banks")

        # Primary score: log-normalized against count saturation
        rest_score = log_normalize(restaurants, cfg["restaurants_saturation"])
        bank_score = log_normalize(banks,       cfg["banks_saturation"])

        # Density bonus: if density data available, adjust upward slightly
        rest_density = self._get_density("restaurants")
        if rest_density > 0:
            density_score = log_normalize(rest_density, dens.get("restaurants", 16.0))
            # Blend: 75% count score + 25% density score
            rest_score = 0.75 * rest_score + 0.25 * density_score

        score = clamp(
            cfg["restaurants_weight"] * rest_score +
            cfg["banks_weight"]       * bank_score
        )

        raw = {
            "key":   self.key,
            "label": "Commercial Activity",
            "score": round(score, 2),
            "inputs": {
                "restaurants": self._get_count("restaurants"),
                "banks":       self._get_count("banks"),
            },
            "sub_scores": {
                "restaurants": round(rest_score, 2),
                "banks":       round(bank_score, 2),
            },
            "nearest_distance": {
                "restaurants": self._get_nearest_distance("restaurants"),
                "banks":       self._get_nearest_distance("banks"),
            },
            "density": {
                "restaurants": round(rest_density, 4),
                "banks":       round(self._get_density("banks"), 4),
            },
        }
        return score, raw
