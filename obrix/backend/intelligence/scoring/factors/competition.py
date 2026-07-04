"""
intelligence/scoring/factors/competition.py

Competition factor — business-type-specific competitive landscape scoring.

Unlike other factors, competition rules vary by business type.
All rules are loaded from config.COMPETITION_RULES — no hardcoding here.

Signal logic
------------
  Positive signal: a category that HELPS this business type (e.g. restaurants
    nearby signal foot traffic for a retail store).
  Negative signal: a category that HURTS this business type (e.g. many hospitals
    nearby compete with a new hospital).

Score formula
-------------
  positive_bonus  = clamp(positive_count / positive_saturation, 0, 1) * (100 - baseline)
  negative_penalty = clamp(negative_count / negative_saturation, 0, 1) * baseline
  score = baseline + positive_bonus - negative_penalty
  score = clamp(score, 10, 100)
"""

from __future__ import annotations
from .base import AbstractFactor
from ..types import FactorScore
from ..config import get_competition_rules


class CompetitionFactor(AbstractFactor):
    """Scores a location's competitive environment for the given business type."""

    key = "competition"

    def __init__(self, lat, lon, radius_m, osm_data, business_type: str = "generic"):
        super().__init__(lat, lon, radius_m, osm_data)
        self.business_type = business_type

    def compute(self) -> tuple[float, dict]:
        rules  = get_competition_rules(self.business_type)
        counts = self.osm_data

        baseline            = rules["baseline"]
        pos_factor          = rules["positive_factor"]
        neg_factor          = rules["negative_factor"]
        pos_saturation      = rules["positive_saturation"] or 1
        neg_saturation      = rules["negative_saturation"] or 1

        pos_count = int(counts.get(pos_factor, 0)) if pos_factor else 0
        neg_count = int(counts.get(neg_factor, 0)) if neg_factor else 0

        positive_bonus   = min(pos_count / pos_saturation, 1.0) * (100 - baseline) if pos_factor else 0
        negative_penalty = min(neg_count / neg_saturation, 1.0) * baseline          if neg_factor else 0

        score = max(10, min(100, baseline + positive_bonus - negative_penalty))

        # Explanation
        parts = []
        if pos_factor and pos_count > 0:
            parts.append(
                f"{pos_count} {pos_factor.replace('_', ' ')} nearby "
                "(positive demand signal)"
            )
        if neg_factor and neg_count > 0:
            parts.append(
                f"{neg_count} competing {neg_factor.replace('_', ' ')} "
                "(market saturation risk)"
            )
        if not parts:
            explanation = (
                f"Competitive landscape is neutral for {self.business_type} — "
                "insufficient OSM data for direct competitor analysis."
            )
        else:
            explanation = ". ".join(parts) + "."

        factor = FactorScore(
            key="competition",
            label="Competition",
            score=round(score, 2),
            explanation=explanation,
            inputs={
                "business_type":  self.business_type,
                "positive_factor": pos_factor,
                "positive_count":  pos_count,
                "negative_factor": neg_factor,
                "negative_count":  neg_count,
            },
            sub_scores={
                "baseline":         float(baseline),
                "positive_bonus":   round(positive_bonus,   2),
                "negative_penalty": round(negative_penalty, 2),
            },
        )
        return factor.score, factor.to_dict()
