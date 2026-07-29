"""
intelligence/scoring/factors/competition.py

Competition factor — Phase 3 Final.

Changes from Phase 3.3:
  - Tag-based competitor detection via CompetitionService (when enriched data available)
  - Falls back to signal-based rules from config when only counts available
  - Score clamped to [10, 100]
"""

from __future__ import annotations

from .base import AbstractFactor
from intelligence.scoring.normalization import clamp
from intelligence.scoring.config import get_competition_rules


class CompetitionFactor(AbstractFactor):
    """Scores competitive landscape for the given business type."""

    key = "competition"

    def __init__(self, lat, lon, radius_m, osm_data, business_type: str = "generic"):
        super().__init__(lat, lon, radius_m, osm_data)
        self.business_type = business_type

    def compute(self) -> tuple[float, dict]:
        # ── Try tag-based competitor detection when enriched data available ───
        competitor_data: dict = {}
        if self._any_enriched():
            try:
                from intelligence.scoring.services.competition import CompetitionService
                from intelligence.scoring.services.distance   import get_distance_service
                features_by_cat = {
                    cat: self._get_features(cat)
                    for cat in self.osm_data
                }
                competitor_data = CompetitionService.detect(
                    features_by_cat,
                    self.business_type,
                    self.lat, self.lon, self.radius_m,
                    distance_service=get_distance_service(),
                )
            except Exception:
                pass  # Gracefully fall back to rules-based scoring

        # ── Rules-based scoring (always computed as baseline) ─────────────────
        rules    = get_competition_rules(self.business_type)
        baseline = rules["baseline"]
        pos_cat  = rules["positive_factor"]
        neg_cat  = rules["negative_factor"]
        pos_sat  = rules["positive_saturation"] or 1
        neg_sat  = rules["negative_saturation"] or 1

        pos_count = self._get_weighted_count(pos_cat) if pos_cat else 0.0
        neg_count = self._get_weighted_count(neg_cat) if neg_cat else 0.0

        positive_bonus   = (min(pos_count / pos_sat, 1.0) * (100 - baseline)) if pos_cat else 0.0
        negative_penalty = (min(neg_count / neg_sat, 1.0) * baseline)          if neg_cat else 0.0

        score = float(baseline) + positive_bonus - negative_penalty

        # If we have tag-based competitor data, adjust for direct competitors
        if competitor_data:
            wc = competitor_data.get("weighted_competitor_count", 0.0)
            # Heavy direct competition → moderate penalty (up to -20)
            competitor_penalty = min(wc * 5.0, 20.0)
            score -= competitor_penalty

        score = clamp(score, lo=10.0, hi=100.0)

        raw = {
            "key":   self.key,
            "label": "Competition",
            "score": round(score, 2),
            "inputs": {
                "business_type":   self.business_type,
                "positive_factor": pos_cat,
                "positive_count":  self._get_count(pos_cat) if pos_cat else 0,
                "negative_factor": neg_cat,
                "negative_count":  self._get_count(neg_cat) if neg_cat else 0,
            },
            "sub_scores": {
                "baseline":          float(baseline),
                "positive_bonus":    round(positive_bonus,   2),
                "negative_penalty":  round(negative_penalty, 2),
                "competitor_penalty": round(
                    min(competitor_data.get("weighted_competitor_count", 0.0) * 5.0, 20.0), 2
                ) if competitor_data else 0.0,
            },
            "competitor_metrics": competitor_data,
        }
        return score, raw
