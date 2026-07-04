"""
intelligence/geo/types.py

Data-transfer objects for the geospatial service layer.

These are plain dataclasses — no Django, no ORM.
The FeatureCollector returns FeatureResult; the scoring engine
consumes it. Both sides depend only on this module.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

# ── Categories ────────────────────────────────────────────────────────────────

ALL_CATEGORIES: tuple[str, ...] = (
    "roads",
    "hospitals",
    "schools",
    "bus_stops",
    "parks",
    "fuel_stations",
    "restaurants",
    "banks",
)


# ── GeoFeature ────────────────────────────────────────────────────────────────

@dataclass
class GeoFeature:
    """
    A single OSM element (node, way, or relation) enriched with a category.

    Attributes
    ----------
    osm_id : str
        Original OSM element ID, prefixed with type (e.g. "node/123456").
    osm_type : str
        "node" | "way" | "relation"
    category : str
        Bucket this feature belongs to (one of ALL_CATEGORIES).
    name : str | None
        Human-readable name from the OSM "name" tag, if present.
    lat : float | None
        Centroid latitude. Available for nodes directly; ways/relations use
        centroid computed by Overpass (requires ``out center``).
    lon : float | None
        Centroid longitude.
    tags : dict[str, str]
        Raw OSM tags as returned by Overpass.
    """

    osm_id: str
    osm_type: str
    category: str
    name: str | None
    lat: float | None
    lon: float | None
    tags: dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Serialise to a plain dict (for JSON / DRF responses)."""
        return {
            "osm_id":   self.osm_id,
            "osm_type": self.osm_type,
            "category": self.category,
            "name":     self.name,
            "lat":      self.lat,
            "lon":      self.lon,
            "tags":     self.tags,
        }


# ── FeatureResult ─────────────────────────────────────────────────────────────

@dataclass
class FeatureResult:
    """
    The complete output of one FeatureCollector.collect() call.

    Attributes
    ----------
    latitude, longitude : float
        The query point (as supplied by the caller).
    radius_m : int
        The search radius in metres.
    features : dict[str, list[GeoFeature]]
        One key per category in ALL_CATEGORIES.  Always present even if empty.
    source : str
        "overpass" | "cache" — where the data came from.
    query_time_ms : float
        Wall-clock time for the Overpass HTTP request (0 if served from cache).
    total : int
        Total number of GeoFeature objects across all categories.
    error : str | None
        If set, the Overpass call failed and categories may be empty.
    """

    latitude: float
    longitude: float
    radius_m: int
    features: dict[str, list[GeoFeature]]
    source: str = "overpass"
    query_time_ms: float = 0.0
    error: str | None = None

    @property
    def total(self) -> int:
        return sum(len(v) for v in self.features.values())

    @property
    def ok(self) -> bool:
        return self.error is None

    def to_dict(self) -> dict[str, Any]:
        """Serialise the full result to a plain dict."""
        return {
            "latitude":       self.latitude,
            "longitude":      self.longitude,
            "radius_m":       self.radius_m,
            "source":         self.source,
            "query_time_ms":  round(self.query_time_ms, 1),
            "total_features": self.total,
            "error":          self.error,
            "features": {
                cat: [f.to_dict() for f in feats]
                for cat, feats in self.features.items()
            },
        }


# ── Factory helper ────────────────────────────────────────────────────────────

def empty_features() -> dict[str, list[GeoFeature]]:
    """Return a dict with all category keys set to empty lists."""
    return {cat: [] for cat in ALL_CATEGORIES}
