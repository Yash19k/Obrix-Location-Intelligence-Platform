"""
intelligence/scoring/factors/base.py

Abstract base class for all scoring factors.

Phase 3 Final: Added helper methods that transparently handle both
  - Legacy format: osm_data = {"roads": 84}  (plain count dict)
  - Enriched format: osm_data = {"roads": {"count": 84, "weighted_count": 21.3, ...}}

Factors use _get_weighted_count() instead of raw counts so distance-weighting
is applied automatically when the engine provides enriched data.
All existing unit tests continue to pass (legacy format still works).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Tuple


class AbstractFactor(ABC):
    """
    Base class for all geospatial scoring factors.

    Subclasses must define:
        key (str):    Unique identifier used in score_breakdown dict
        compute() → (float, dict): Returns (score_0_to_100, raw_metadata)

    raw_metadata must contain at minimum:
        "key":       str
        "label":     str
        "score":     float
        "inputs":    dict   (raw values used)
        "sub_scores": dict  (per-component intermediate scores)

    The engine passes raw_metadata to ExplainabilityBuilder to generate
    the "explanation" field — factors themselves do NOT generate it.
    """

    key: str = NotImplemented

    def __init__(self, lat: float, lon: float, radius_m: int, osm_data: dict):
        self.lat      = lat
        self.lon      = lon
        self.radius_m = radius_m
        self.osm_data = osm_data

    @abstractmethod
    def compute(self) -> Tuple[float, dict]:
        """
        Compute the factor score.

        Returns:
            score (float): 0–100, higher is better
            raw   (dict):  metadata dict (key, label, score, inputs, sub_scores)
        """
        raise NotImplementedError

    # ── Data access helpers ───────────────────────────────────────────────────
    # These methods transparently handle both legacy (int) and enriched (dict)
    # formats for osm_data values.

    def _is_enriched(self, cat: str) -> bool:
        """True when the engine has provided full enriched data for this category."""
        return isinstance(self.osm_data.get(cat), dict)

    def _get_count(self, cat: str) -> int:
        """Raw feature count (no distance weighting)."""
        v = self.osm_data.get(cat, 0)
        if isinstance(v, dict):
            return int(v.get("count", 0))
        return int(v or 0)

    def _get_weighted_count(self, cat: str) -> float:
        """
        Distance-weighted effective count.

        When enriched data is available: uses pre-computed weighted_count
        (each feature decayed by distance, nearby features count more).
        When only count data is available: returns raw count as float
        (maintains backward compat with existing unit tests).
        """
        v = self.osm_data.get(cat, 0)
        if isinstance(v, dict):
            return float(v.get("weighted_count", v.get("count", 0)))
        return float(v or 0)

    def _get_density(self, cat: str) -> float:
        """Features per km². Returns 0.0 when not in enriched format."""
        v = self.osm_data.get(cat, 0)
        if isinstance(v, dict):
            return float(v.get("density", 0.0))
        return 0.0

    def _get_features(self, cat: str) -> list:
        """Full GeoFeature list. Returns [] when not in enriched format."""
        v = self.osm_data.get(cat, 0)
        if isinstance(v, dict):
            return v.get("features", [])
        return []

    def _get_nearest_distance(self, cat: str) -> float | None:
        """Distance to nearest feature in metres. None when unavailable."""
        v = self.osm_data.get(cat, 0)
        if isinstance(v, dict):
            return v.get("nearest_distance")
        return None

    def _get_avg_distance(self, cat: str) -> float | None:
        """Average distance to all features in metres. None when unavailable."""
        v = self.osm_data.get(cat, 0)
        if isinstance(v, dict):
            return v.get("avg_distance")
        return None

    def _any_enriched(self) -> bool:
        """True if at least one category has enriched data."""
        return any(isinstance(v, dict) for v in self.osm_data.values())
