"""
intelligence/scoring/types.py

Data-transfer objects for the scoring engine.

Pure Python dataclasses — no Django, no ORM.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any


@dataclass
class FactorScore:
    """
    The computed output of a single scoring factor.

    Attributes
    ----------
    key : str
        Machine-readable factor key (e.g. "accessibility").
    label : str
        Human-readable label for display (e.g. "Accessibility").
    score : float
        0–100, higher is better.
    explanation : str
        One-sentence human-readable explanation of the score.
    inputs : dict
        Raw input values used to compute the score (for debugging / ML training).
    sub_scores : dict
        Per-component scores within the factor (for transparency).
    """
    key:         str
    label:       str
    score:       float
    explanation: str
    inputs:      dict[str, Any] = field(default_factory=dict)
    sub_scores:  dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "key":         self.key,
            "label":       self.label,
            "score":       round(self.score, 2),
            "explanation": self.explanation,
            "inputs":      self.inputs,
            "sub_scores":  {k: round(v, 2) for k, v in self.sub_scores.items()},
        }


@dataclass
class ScoreResult:
    """
    The complete output of one ScoringEngine.calculate() call.

    Attributes
    ----------
    overall : float
        Weighted final score (0–100).
    factors : dict[str, FactorScore]
        One FactorScore per factor key.
    weights_used : dict[str, float]
        The weight profile applied (sum == 1.0).
    business_type : str
        The business type that determined the weights.
    """
    overall:       float
    factors:       dict[str, FactorScore]
    weights_used:  dict[str, float]
    business_type: str

    def to_score_breakdown(self) -> dict[str, float]:
        """Return {factor_key: score} — matches the DB field shape."""
        return {k: round(v.score, 2) for k, v in self.factors.items()}

    def to_raw_factors(self) -> dict[str, Any]:
        """Return the full factor detail dict — stored in raw_factors DB field."""
        return {k: v.to_dict() for k, v in self.factors.items()}

    def to_dict(self) -> dict[str, Any]:
        return {
            "overall":       round(self.overall, 2),
            "business_type": self.business_type,
            "weights_used":  self.weights_used,
            "factors":       {k: v.to_dict() for k, v in self.factors.items()},
        }
