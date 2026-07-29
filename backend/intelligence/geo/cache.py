"""
intelligence/geo/cache.py

Cache layer for FeatureResult objects.

Uses Django's built-in cache framework (``django.core.cache``).
In development this is in-memory (LocMemCache).
In production, point CACHES to Redis or Memcached in settings.

The cache is a transparent wrapper — FeatureCollector calls
``cache.get()`` before hitting Overpass, and ``cache.set()`` after.

Key design decisions
---------------------
- Lat/lon rounded to 4 decimal places (≈11 m grid) before building the key.
  Points within the same 11m cell share a cache entry, which is acceptable
  for feature counts at typical analysis radii (500m–10km).
- TTL: 15 minutes.  Overpass data doesn't change rapidly enough to need
  shorter TTLs in an analysis context.
- The FeatureResult is serialised as a plain dict (no pickle) for
  compatibility with Django's JSONSerializer-based backends.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from .types import (
    ALL_CATEGORIES,
    GeoFeature,
    FeatureResult,
    empty_features,
)

logger = logging.getLogger(__name__)

# ── Settings ──────────────────────────────────────────────────────────────────

CACHE_TTL_SECONDS = 60 * 15          # 15 minutes
CACHE_KEY_PREFIX  = "obrix_geo_v1"   # bump version to invalidate all keys

# Lat/lon precision for cache-key bucketing (4dp ≈ 11 m)
_LAT_LON_PRECISION = 4


# ── Serialisation helpers ─────────────────────────────────────────────────────

def _result_to_cache(result: FeatureResult) -> dict[str, Any]:
    """Convert a FeatureResult to a JSON-safe dict for storage."""
    return {
        "latitude":      result.latitude,
        "longitude":     result.longitude,
        "radius_m":      result.radius_m,
        "source":        result.source,
        "query_time_ms": result.query_time_ms,
        "error":         result.error,
        "features": {
            cat: [f.to_dict() for f in feats]
            for cat, feats in result.features.items()
        },
    }


def _result_from_cache(data: dict[str, Any]) -> FeatureResult:
    """Rebuild a FeatureResult from a cached dict."""
    features: dict[str, list[GeoFeature]] = empty_features()
    for cat, feat_list in data.get("features", {}).items():
        if cat not in features:
            continue
        for fd in feat_list:
            features[cat].append(GeoFeature(
                osm_id   = fd["osm_id"],
                osm_type = fd["osm_type"],
                category = fd["category"],
                name     = fd.get("name"),
                lat      = fd.get("lat"),
                lon      = fd.get("lon"),
                tags     = fd.get("tags", {}),
            ))

    return FeatureResult(
        latitude      = data["latitude"],
        longitude     = data["longitude"],
        radius_m      = data["radius_m"],
        features      = features,
        source        = "cache",
        query_time_ms = 0.0,
        error         = data.get("error"),
    )


# ── FeatureCache ──────────────────────────────────────────────────────────────

class FeatureCache:
    """
    Thin cache layer over Django's cache framework.

    Usage
    -----
    cache = FeatureCache()
    result = cache.get(lat, lon, radius_m)   # None on miss
    cache.set(result)                         # store for TTL
    """

    @staticmethod
    def _make_key(lat: float, lon: float, radius_m: int) -> str:
        lat_r = round(lat, _LAT_LON_PRECISION)
        lon_r = round(lon, _LAT_LON_PRECISION)
        return f"{CACHE_KEY_PREFIX}:{lat_r}:{lon_r}:{radius_m}"

    def get(self, lat: float, lon: float, radius_m: int) -> Optional[FeatureResult]:
        """
        Return a cached FeatureResult or None on cache miss.
        Failures (cache backend down) are caught and treated as a miss.
        """
        try:
            from django.core.cache import cache as django_cache
            key  = self._make_key(lat, lon, radius_m)
            data = django_cache.get(key)
            if data is None:
                return None
            result = _result_from_cache(data)
            logger.debug("Cache HIT  key=%s  total=%d", key, result.total)
            return result
        except Exception as exc:
            logger.warning("Cache get failed (%s) — treating as miss.", exc)
            return None

    def set(self, result: FeatureResult) -> None:
        """
        Store a FeatureResult.
        Failures (cache backend down) are silently ignored.
        """
        try:
            from django.core.cache import cache as django_cache
            key  = self._make_key(result.latitude, result.longitude, result.radius_m)
            data = _result_to_cache(result)
            django_cache.set(key, data, timeout=CACHE_TTL_SECONDS)
            logger.debug("Cache SET  key=%s  total=%d  ttl=%ds",
                         key, result.total, CACHE_TTL_SECONDS)
        except Exception as exc:
            logger.warning("Cache set failed (%s) — result not cached.", exc)

    def delete(self, lat: float, lon: float, radius_m: int) -> None:
        """Explicitly evict a cache entry (useful in tests)."""
        try:
            from django.core.cache import cache as django_cache
            django_cache.delete(self._make_key(lat, lon, radius_m))
        except Exception:
            pass
