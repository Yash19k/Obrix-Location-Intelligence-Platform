"""
intelligence/scoring/services/distance.py

DistanceService abstraction.

Provides an interface so Haversine (Overpass data) can be swapped for
PostGIS spatial queries (Phase 4, when OSM data is stored locally) without
any change to the scoring engine or factor classes.

Usage
-----
    svc = get_distance_service()         # returns HaversineDistanceService
    d   = svc.distance(lat1, lon1, lat2, lon2)
    near = svc.nearest(features, lat, lon)
    wc   = svc.weighted_count(features, lat, lon, radius_m)
"""

from __future__ import annotations

import math
from abc import ABC, abstractmethod
from typing import Any

from intelligence.scoring.normalization import distance_decay


# ── Abstract interface ────────────────────────────────────────────────────────

class DistanceService(ABC):
    """
    Abstract distance-calculation service.

    Swap implementations without touching the scoring engine.
    Current implementation: HaversineDistanceService.
    Phase 4 implementation: PostGISDistanceService (ST_Distance on geography columns).
    """

    @abstractmethod
    def distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Point-to-point distance in metres."""
        ...

    def nearest(
        self,
        features: list,
        center_lat: float,
        center_lon: float,
    ) -> float | None:
        """Distance to the closest feature that has coordinates. None if none found."""
        min_d: float = float("inf")
        for f in features:
            if f.lat is not None and f.lon is not None:
                d = self.distance(center_lat, center_lon, f.lat, f.lon)
                if d < min_d:
                    min_d = d
        return round(min_d, 1) if min_d < float("inf") else None

    def average(
        self,
        features: list,
        center_lat: float,
        center_lon: float,
    ) -> float | None:
        """Average distance to all features that have coordinates."""
        dists = [
            self.distance(center_lat, center_lon, f.lat, f.lon)
            for f in features
            if f.lat is not None and f.lon is not None
        ]
        return round(sum(dists) / len(dists), 1) if dists else None

    def weighted_count(
        self,
        features: list,
        center_lat: float,
        center_lon: float,
        radius_m: float,
        decay_rate: float = 3.0,
    ) -> float:
        """
        Distance-weighted effective feature count.

        Each feature contributes exp(-decay * d / radius) instead of 1.
        Features without coordinates contribute 0.5 (conservative mid-weight).

        A cluster of hospitals at 100m scores far higher than the same number
        distributed at 900m — properly reflecting site readiness.
        """
        total = 0.0
        for f in features:
            if f.lat is not None and f.lon is not None:
                d = self.distance(center_lat, center_lon, f.lat, f.lon)
                total += distance_decay(d, radius_m, decay_rate)
            else:
                total += 0.5
        return round(total, 4)

    def distance_band_counts(
        self,
        features: list,
        center_lat: float,
        center_lon: float,
        bands: tuple[int, ...] = (250, 500, 1000),
    ) -> dict[str, int]:
        """
        Count features in concentric distance bands.

        Returns {"0-250m": 3, "250-500m": 5, "500-1000m": 12, ">1000m": 0}
        """
        counts: dict[str, int] = {}
        prev = 0
        for b in bands:
            key = f"{prev}-{b}m"
            counts[key] = 0
            prev = b
        counts[f">{bands[-1]}m"] = 0

        for f in features:
            if f.lat is None or f.lon is None:
                continue
            d = self.distance(center_lat, center_lon, f.lat, f.lon)
            placed = False
            prev = 0
            for b in bands:
                if d <= b:
                    counts[f"{prev}-{b}m"] = counts.get(f"{prev}-{b}m", 0) + 1
                    placed = True
                    break
                prev = b
            if not placed:
                counts[f">{bands[-1]}m"] = counts.get(f">{bands[-1]}m", 0) + 1

        return counts


# ── Haversine implementation ──────────────────────────────────────────────────

class HaversineDistanceService(DistanceService):
    """
    Haversine great-circle distance — used when OSM data comes from Overpass.

    Accuracy: <0.3% vs PostGIS ST_Distance(geography) for distances ≤ 5km.
    Deterministic, zero DB queries, O(n) over GeoFeature lists.
    """

    _R = 6_371_000.0  # Earth radius in metres

    def distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = self._R
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi    = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


# ── Factory ───────────────────────────────────────────────────────────────────

def get_distance_service() -> DistanceService:
    """
    Return the active DistanceService implementation.

    Phase 3: HaversineDistanceService (Overpass data, no DB queries).
    Phase 4: swap to PostGISDistanceService (local OSM import).
    """
    return HaversineDistanceService()
