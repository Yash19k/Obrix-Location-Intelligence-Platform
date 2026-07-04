"""
intelligence/scoring/factors/accessibility.py

Accessibility factor — measures how reachable a location is.

Inputs (from feature_counts)
-----------------------------
- roads:     total road segments within radius
- bus_stops: number of bus stop nodes

Formula
-------
  roads_score     = clamp(roads / roads_saturation, 0, 1) * 100
  bus_score       = clamp(bus_stops / bus_saturation, 0, 1) * 100
  accessibility   = roads_weight * roads_score + bus_weight * bus_score

All thresholds are loaded from config.py — no magic numbers here.
"""

from __future__ import annotations
from .base import AbstractFactor
from ..types import FactorScore
from ..config import FACTOR_THRESHOLDS


class AccessibilityFactor(AbstractFactor):
    """Scores location based on road network density and public transit access."""

    key = "accessibility"

    def compute(self) -> tuple[float, dict]:
        cfg    = FACTOR_THRESHOLDS["accessibility"]
        counts = self.osm_data

        roads     = int(counts.get("roads",     0))
        bus_stops = int(counts.get("bus_stops", 0))

        roads_score = min(roads     / cfg["roads_saturation"],     1.0) * 100
        bus_score   = min(bus_stops / cfg["bus_stops_saturation"], 1.0) * 100

        score = (
            cfg["roads_weight"]     * roads_score +
            cfg["bus_stops_weight"] * bus_score
        )

        # Generate a human-readable explanation
        if score >= 80:
            explanation = (
                f"Excellent access — {roads} roads and {bus_stops} bus stop(s) "
                "indicate strong connectivity."
            )
        elif score >= 55:
            explanation = (
                f"Good access — {roads} roads and {bus_stops} bus stop(s). "
                "Transit coverage is adequate."
            )
        elif score >= 30:
            explanation = (
                f"Moderate access — {roads} road(s) and {bus_stops} bus stop(s). "
                "Consider proximity to main arterials."
            )
        else:
            explanation = (
                f"Limited access — only {roads} road(s) and {bus_stops} bus stop(s) "
                "within the search radius."
            )

        factor = FactorScore(
            key="accessibility",
            label="Accessibility",
            score=round(score, 2),
            explanation=explanation,
            inputs={"roads": roads, "bus_stops": bus_stops},
            sub_scores={"roads": round(roads_score, 2), "bus_stops": round(bus_score, 2)},
        )
        return factor.score, factor.to_dict()

    @staticmethod
    def compute_from_counts(counts: dict) -> FactorScore:
        """Convenience method — returns a FactorScore directly (used by engine)."""
        f = AccessibilityFactor(lat=0, lon=0, radius_m=1000, osm_data=counts)
        score, raw = f.compute()
        return FactorScore(**{k: raw[k] for k in FactorScore.__dataclass_fields__})
