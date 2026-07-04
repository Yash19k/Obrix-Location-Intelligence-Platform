"""
intelligence/scoring/factors/environment.py

Environmental Suitability factor — placeholder with clean interface.

Phase 3.3: Uses park density as a simple proxy for green-space quality.

Future phases can augment this with:
  - Satellite-derived NDVI (vegetation index)
  - Air quality index (AQI) API
  - Flood zone data (FEMA / open government datasets)
  - Noise pollution estimates

The interface (AbstractFactor.compute()) will not change when these are added.
"""

from __future__ import annotations
from .base import AbstractFactor
from ..types import FactorScore
from ..config import FACTOR_THRESHOLDS


class EnvironmentFactor(AbstractFactor):
    """
    Scores environmental suitability.

    Phase 3.3 implementation: parks as a proxy for green space availability.
    Returns 50 (neutral) when park data is unavailable.
    """

    key = "environment"

    def compute(self) -> tuple[float, dict]:
        cfg    = FACTOR_THRESHOLDS["environment"]
        counts = self.osm_data

        parks = int(counts.get("parks", 0))

        if parks == 0 and not counts:
            # No OSM data at all — return neutral
            score       = float(cfg["default_score"])
            explanation = "Environmental data unavailable — using neutral score."
            sub_scores  = {}
        else:
            parks_score = min(parks / cfg["parks_saturation"], 1.0) * 100
            score       = cfg["parks_weight"] * parks_score

            if score >= 80:
                explanation = (
                    f"{parks} park(s) detected — strong green space availability. "
                    "Positive for staff wellbeing and public appeal."
                )
            elif score >= 40:
                explanation = (
                    f"{parks} park(s) nearby — adequate green space. "
                    "Full environmental analysis pending future data sources."
                )
            elif parks == 0:
                explanation = (
                    "No parks detected within the search radius. "
                    "Environmental suitability assessment limited. "
                    "Future phases will incorporate satellite NDVI and air quality data."
                )
            else:
                explanation = (
                    f"Limited green space — {parks} park(s) detected. "
                    "Environmental assessment will improve with additional data sources."
                )

            sub_scores = {"parks": round(parks_score, 2)}

        factor = FactorScore(
            key="environment",
            label="Environmental Suitability",
            score=round(score, 2),
            explanation=explanation,
            inputs={"parks": parks},
            sub_scores=sub_scores,
        )
        return factor.score, factor.to_dict()
