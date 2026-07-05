"""
intelligence/scoring/factors/environment.py

Environmental Suitability factor — Phase 3 Final.

Changes from Phase 3.3:
  - Log normalization
  - Distance-weighted park score
  - Nearest park distance in metadata
  - Explanation delegated to ExplainabilityBuilder
"""

from __future__ import annotations

from .base import AbstractFactor
from intelligence.scoring.normalization import log_normalize, clamp
from intelligence.scoring.config import FACTOR_THRESHOLDS


class EnvironmentFactor(AbstractFactor):
    """
    Scores environmental suitability.

    Phase 3 Final: log normalization + distance weighting.
    Phase 4: extend with NDVI, AQI, flood zone data.
    """

    key = "environment"

    def compute(self) -> tuple[float, dict]:
        cfg   = FACTOR_THRESHOLDS["environment"]
        parks = self._get_weighted_count("parks")

        # Log normalization: 0 parks → 0 score (intentional — no parks = low suitability)
        parks_score = log_normalize(parks, cfg["parks_saturation"])
        score       = clamp(cfg["parks_weight"] * parks_score)

        raw = {
            "key":   self.key,
            "label": "Environmental Suitability",
            "score": round(score, 2),
            "inputs": {
                "parks": self._get_count("parks"),
            },
            "sub_scores": {
                "parks": round(parks_score, 2),
            },
            "nearest_distance": {
                "parks": self._get_nearest_distance("parks"),
            },
            "density": {
                "parks": self._get_density("parks"),
            },
            "note": (
                "Phase 3: Parks as green-space proxy. "
                "Phase 4 will add NDVI, AQI, and flood zone data."
            ),
        }
        return score, raw
