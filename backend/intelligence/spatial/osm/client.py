"""
intelligence/spatial/osm/client.py

PostGISClient — local PostGIS database feature provider.

Implements the fetch(lat, lon, radius_m) -> FeatureResult contract.
"""

from __future__ import annotations

import logging
import time
from typing import Dict, List

from intelligence.geo.types import (
    ALL_CATEGORIES,
    GeoFeature,
    FeatureResult,
    empty_features,
)
from .queries import execute_category_query
from .mapper import map_row_to_geofeature

logger = logging.getLogger(__name__)


class PostGISClient:
    """
    Local PostGIS-backed OpenStreetMap feature backend.

    Queries local PostgreSQL/PostGIS database imported via osm2pgsql.
    Returns standard FeatureResult objects for full compatibility with
    FeatureCollector and ScoringEngine.
    """

    def fetch(self, lat: float, lon: float, radius_m: int) -> FeatureResult:
        """
        Fetch OSM features for all 8 categories within radius_m of (lat, lon).
        """
        self._validate(lat, lon, radius_m)
        t0 = time.perf_counter()
        features: Dict[str, List[GeoFeature]] = empty_features()
        error_msg: str | None = None

        try:
            for category in ALL_CATEGORIES:
                rows = execute_category_query(category=category, lat=lat, lon=lon, radius_m=radius_m)
                for r in rows:
                    feat = map_row_to_geofeature(r, category=category, osm_type=r.get("osm_type", "node"))
                    features[category].append(feat)

        except Exception as exc:
            logger.error("PostGISClient fetch failed: %s", exc, exc_info=True)
            error_msg = f"PostGIS query failed: {exc}"

        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        total_feats = sum(len(v) for v in features.values())
        logger.info(
            "PostGISClient fetch complete: lat=%.4f lon=%.4f r=%dm total=%d time=%.1fms error=%s",
            lat, lon, radius_m, total_feats, elapsed_ms, error_msg,
        )

        return FeatureResult(
            latitude=lat,
            longitude=lon,
            radius_m=radius_m,
            features=features,
            source="postgis",
            query_time_ms=elapsed_ms,
            error=error_msg,
        )

    @staticmethod
    def _validate(lat: float, lon: float, radius_m: int) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"Invalid latitude: {lat}")
        if not (-180 <= lon <= 180):
            raise ValueError(f"Invalid longitude: {lon}")
        if not (50 <= radius_m <= 50_000):
            raise ValueError(f"radius_m must be between 50 and 50000, got {radius_m}")
