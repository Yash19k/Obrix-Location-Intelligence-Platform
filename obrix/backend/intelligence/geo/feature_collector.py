"""
intelligence/geo/feature_collector.py

Public interface for the geospatial service layer.

This is the ONLY class that callers (analysis views, scoring engine,
management commands) should import.  Overpass and cache are implementation
details that live behind this façade.

Swapping to a PostGIS backend later means:
  1. Creating a PostGISClient with the same .fetch() signature as OverpassClient.
  2. Passing it as the `backend` argument to FeatureCollector().
  Nothing else changes.

Usage
-----
from intelligence.geo import FeatureCollector

collector = FeatureCollector()
result = collector.collect(lat=28.6139, lon=77.2090, radius_m=1000)

if result.ok:
    roads      = result.features["roads"]       # list[GeoFeature]
    hospitals  = result.features["hospitals"]
    ...
    print(result.total)                         # total features found
else:
    print(result.error)
"""

from __future__ import annotations

import logging
from typing import Optional

from .cache import FeatureCache
from .overpass import OverpassClient
from .types import FeatureResult

logger = logging.getLogger(__name__)


class FeatureCollector:
    """
    Façade for the geospatial feature-retrieval pipeline.

    Pipeline
    --------
    1. Validate inputs (raises ValueError on obviously bad data).
    2. Check the cache → return immediately if hit.
    3. Fetch from the Overpass API backend.
    4. Store result in cache.
    5. Return FeatureResult.

    Parameters
    ----------
    backend : optional
        Any object with a ``.fetch(lat, lon, radius_m) -> FeatureResult``
        method.  Defaults to ``OverpassClient()``.
        Pass a mock here in unit tests.
    cache : optional
        Cache implementation.  Defaults to ``FeatureCache()``.
        Pass ``None`` to disable caching (useful in tests / CLI commands).
    """

    def __init__(
        self,
        backend=None,
        cache: Optional[FeatureCache] = None,
    ) -> None:
        self._backend = backend or OverpassClient()
        self._cache   = cache if cache is not None else FeatureCache()

    # ── Public interface ──────────────────────────────────────────────────────

    def collect(
        self,
        lat: float,
        lon: float,
        radius_m: int = 1000,
    ) -> FeatureResult:
        """
        Retrieve all geospatial features near (lat, lon) within radius_m metres.

        Returns a ``FeatureResult`` with all 8 categories.
        Never raises — error conditions are captured in ``result.error``.

        Parameters
        ----------
        lat : float
            WGS-84 latitude  (-90 … +90).
        lon : float
            WGS-84 longitude (-180 … +180).
        radius_m : int
            Search radius in metres (50 – 50 000).  Defaults to 1000.
        """
        # ── 1. Validate ───────────────────────────────────────────────────────
        self._backend._validate(lat, lon, radius_m)   # re-use client validator

        # ── 2. Cache lookup ───────────────────────────────────────────────────
        if self._cache:
            cached = self._cache.get(lat, lon, radius_m)
            if cached is not None:
                logger.info(
                    "FeatureCollector: cache hit (lat=%.4f lon=%.4f r=%dm total=%d)",
                    lat, lon, radius_m, cached.total,
                )
                return cached

        # ── 3. Fetch from backend ─────────────────────────────────────────────
        logger.info(
            "FeatureCollector: fetching from %s (lat=%.4f lon=%.4f r=%dm)",
            type(self._backend).__name__, lat, lon, radius_m,
        )
        result = self._backend.fetch(lat=lat, lon=lon, radius_m=radius_m)

        # ── 4. Store in cache (only on success) ───────────────────────────────
        if result.ok and self._cache:
            self._cache.set(result)

        # ── 5. Return ─────────────────────────────────────────────────────────
        return result

    def collect_summary(
        self,
        lat: float,
        lon: float,
        radius_m: int = 1000,
    ) -> dict:
        """
        Convenience method — returns a plain dict with category counts.

        Useful for quick logging, admin views, or the scoring engine's
        pre-flight check.

        Returns
        -------
        {
            "ok": True,
            "source": "overpass",
            "query_time_ms": 342.0,
            "counts": {
                "roads": 12,
                "hospitals": 2,
                ...
            },
            "total": 47,
            "error": None,
        }
        """
        result = self.collect(lat, lon, radius_m)
        return {
            "ok":            result.ok,
            "source":        result.source,
            "query_time_ms": round(result.query_time_ms, 1),
            "counts":        {cat: len(feats) for cat, feats in result.features.items()},
            "total":         result.total,
            "error":         result.error,
        }
