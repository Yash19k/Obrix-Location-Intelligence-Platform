"""
intelligence/scoring/factors/commercial.py

Commercial Activity factor — measures economic vitality of the area.

Inputs (from feature_counts)
-----------------------------
- restaurants: cafes, restaurants, fast food (proxy for foot traffic)
- banks:       financial services (proxy for commercial zone maturity)

High restaurant density signals daytime foot traffic and consumer spending.
High bank density signals an established commercial zone.
"""

from __future__ import annotations
from .base import AbstractFactor
from ..types import FactorScore
from ..config import FACTOR_THRESHOLDS


class CommercialFactor(AbstractFactor):
    """Scores a location based on dining density and financial services presence."""

    key = "commercial"

    def compute(self) -> tuple[float, dict]:
        cfg    = FACTOR_THRESHOLDS["commercial"]
        counts = self.osm_data

        restaurants = int(counts.get("restaurants", 0))
        banks       = int(counts.get("banks",       0))

        rest_score = min(restaurants / cfg["restaurants_saturation"], 1.0) * 100
        bank_score = min(banks       / cfg["banks_saturation"],       1.0) * 100

        score = (
            cfg["restaurants_weight"] * rest_score +
            cfg["banks_weight"]       * bank_score
        )

        # Explanation
        if score >= 80:
            explanation = (
                f"High commercial activity — {restaurants} dining venue(s) and "
                f"{banks} bank(s)/ATM(s) indicate a thriving commercial zone."
            )
        elif score >= 55:
            explanation = (
                f"Moderate commercial activity — {restaurants} restaurant(s) "
                f"and {banks} bank(s) indicate an established area."
            )
        elif score >= 25:
            explanation = (
                f"Developing commercial area — {restaurants} restaurant(s) "
                f"and {banks} bank(s) within the search radius."
            )
        else:
            explanation = (
                f"Low commercial activity — only {restaurants} restaurant(s) "
                f"and {banks} bank(s) detected."
            )

        factor = FactorScore(
            key="commercial",
            label="Commercial Activity",
            score=round(score, 2),
            explanation=explanation,
            inputs={"restaurants": restaurants, "banks": banks},
            sub_scores={
                "restaurants": round(rest_score, 2),
                "banks":       round(bank_score, 2),
            },
        )
        return factor.score, factor.to_dict()
