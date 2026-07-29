"""
intelligence/geo/__init__.py

Public API of the geo package.

Callers only need:

    from intelligence.geo import FeatureCollector, FeatureResult, GeoFeature

Everything else (OverpassClient, FeatureCache, query builder, etc.)
is a private implementation detail and should not be imported directly
by code outside this package.
"""

from .feature_collector import FeatureCollector
from .types import (
    GeoFeature,
    FeatureResult,
    ALL_CATEGORIES,
    empty_features,
)

__all__ = [
    "FeatureCollector",
    "GeoFeature",
    "FeatureResult",
    "ALL_CATEGORIES",
    "empty_features",
]
