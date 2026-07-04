"""
intelligence/scoring/factors/infrastructure.py

Infrastructure factor — measures the density of essential urban services.

Inputs (from feature_counts)
-----------------------------
- hospitals:     medical facilities
- schools:       educational institutions
- banks:         financial services
- fuel_stations: refuelling access (proxy for utility infrastructure)

Formula
-------
  Each sub-component scored 0–100 by clamp(count / saturation, 0, 1) * 100.
  Final score = weighted sum of sub-component scores.
  All weights from FACTOR_THRESHOLDS["infrastructure"] in config.py.
"""

from __future__ import annotations
from .base import AbstractFactor
from ..types import FactorScore
from ..config import FACTOR_THRESHOLDS


class InfrastructureFactor(AbstractFactor):
    """Scores a location based on density of hospitals, schools, banks, and fuel stations."""

    key = "infrastructure"

    def compute(self) -> tuple[float, dict]:
        cfg    = FACTOR_THRESHOLDS["infrastructure"]
        counts = self.osm_data

        hospitals     = int(counts.get("hospitals",     0))
        schools       = int(counts.get("schools",       0))
        banks         = int(counts.get("banks",         0))
        fuel_stations = int(counts.get("fuel_stations", 0))

        hosp_score = min(hospitals     / cfg["hospitals_saturation"],     1.0) * 100
        sch_score  = min(schools       / cfg["schools_saturation"],       1.0) * 100
        bank_score = min(banks         / cfg["banks_saturation"],         1.0) * 100
        fuel_score = min(fuel_stations / cfg["fuel_stations_saturation"], 1.0) * 100

        score = (
            cfg["hospitals_weight"]     * hosp_score +
            cfg["schools_weight"]       * sch_score  +
            cfg["banks_weight"]         * bank_score +
            cfg["fuel_stations_weight"] * fuel_score
        )

        # Explanation
        strengths  = []
        weaknesses = []

        if hospitals >= cfg["hospitals_saturation"]:
            strengths.append(f"{hospitals} hospital(s)")
        elif hospitals == 0:
            weaknesses.append("no hospitals")

        if schools >= cfg["schools_saturation"]:
            strengths.append(f"{schools} school(s)")
        elif schools == 0:
            weaknesses.append("no schools")

        if banks >= cfg["banks_saturation"]:
            strengths.append(f"{banks} bank(s)/ATM(s)")

        if strengths and not weaknesses:
            explanation = f"Strong infrastructure — {', '.join(strengths)} detected nearby."
        elif weaknesses and not strengths:
            explanation = (
                f"Weak infrastructure — {', '.join(weaknesses)} within the radius. "
                "Scores may improve with a larger search radius."
            )
        elif strengths and weaknesses:
            explanation = (
                f"Mixed infrastructure: strong on {', '.join(strengths)}, "
                f"but {', '.join(weaknesses)}."
            )
        else:
            explanation = (
                f"Adequate infrastructure — {hospitals} hospital(s), "
                f"{schools} school(s), {banks} bank(s)."
            )

        factor = FactorScore(
            key="infrastructure",
            label="Infrastructure",
            score=round(score, 2),
            explanation=explanation,
            inputs={
                "hospitals":     hospitals,
                "schools":       schools,
                "banks":         banks,
                "fuel_stations": fuel_stations,
            },
            sub_scores={
                "hospitals":     round(hosp_score, 2),
                "schools":       round(sch_score,  2),
                "banks":         round(bank_score, 2),
                "fuel_stations": round(fuel_score, 2),
            },
        )
        return factor.score, factor.to_dict()
