"""
intelligence/osm/fetcher.py

Backwards-compatible shim.

Phase 3: Delegates to ``intelligence.geo.FeatureCollector``.
Phase 5+: May be removed once all callers import FeatureCollector directly.

The original Phase 4 stub returned a flat dict with placeholder lists.
This shim preserves that interface so no existing code breaks while the
rest of the backend is migrated to the new FeatureResult API.
"""

import logging

logger = logging.getLogger(__name__)


def fetch_nearby_features(lat: float, lon: float, radius_m: int) -> dict:
    """
    Query geospatial features near the given point.

    Returns a plain dict keyed by category, each value being a list of
    feature dicts.  Empty lists are returned for any category with no hits
    or when the backend call fails.

    .. deprecated::
        Import ``intelligence.geo.FeatureCollector`` directly for new code.
        This function exists only for backward compatibility.
    """
    from intelligence.geo import FeatureCollector  # lazy import avoids circular deps

    logger.debug(
        "fetch_nearby_features shim called (lat=%.4f lon=%.4f r=%dm) — "
        "delegating to FeatureCollector",
        lat, lon, radius_m,
    )

    collector = FeatureCollector()
    result    = collector.collect(lat=lat, lon=lon, radius_m=radius_m)

    # Serialise GeoFeature objects to plain dicts to match the old interface
    return {
        category: [feature.to_dict() for feature in features]
        for category, features in result.features.items()
    }
