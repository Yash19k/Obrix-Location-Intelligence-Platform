"""
intelligence/scoring/metrics.py

Geospatial metric calculations for the scoring engine.

Pure Python — no Django, no ORM.
Uses Haversine for distance (mathematically equivalent to PostGIS ST_Distance
on WGS84; will be replaced with PostGIS queries in Phase 4 when OSM data
is imported to the local database).
"""

from __future__ import annotations

import math
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from intelligence.geo.types import GeoFeature

from .normalization import distance_decay

# ── Distance ──────────────────────────────────────────────────────────────────

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Great-circle distance between two WGS84 points in metres.
    Accuracy: <0.3% error vs PostGIS ST_Distance(geography).
    """
    R = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi       = math.radians(lat2 - lat1)
    dlambda    = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def compute_area_km2(radius_m: float) -> float:
    """Circular area in km² for the given radius in metres."""
    return math.pi * (radius_m / 1000.0) ** 2


def compute_density(count: int, radius_m: float) -> float:
    """Features per km²."""
    area = compute_area_km2(radius_m)
    return round(count / area, 4) if area > 0 else 0.0


def compute_distances(
    features: list,           # list[GeoFeature]
    center_lat: float,
    center_lon: float,
) -> list[float]:
    """Return sorted list of distances (metres) for features that have lat/lon."""
    distances = []
    for f in features:
        if f.lat is not None and f.lon is not None:
            distances.append(haversine_distance(center_lat, center_lon, f.lat, f.lon))
    distances.sort()
    return distances


def compute_average_distance(
    features: list,
    center_lat: float,
    center_lon: float,
) -> float | None:
    """Average distance to all features. None if no features have coordinates."""
    dists = compute_distances(features, center_lat, center_lon)
    return round(sum(dists) / len(dists), 1) if dists else None


def compute_nearest_distance(
    features: list,
    center_lat: float,
    center_lon: float,
) -> float | None:
    """Distance to the nearest feature. None if no features have coordinates."""
    dists = compute_distances(features, center_lat, center_lon)
    return round(dists[0], 1) if dists else None


def compute_distance_weighted_count(
    features: list,
    center_lat: float,
    center_lon: float,
    radius_m: float,
    decay_rate: float = 3.0,
) -> float:
    """
    Distance-weighted effective count.

    Each feature contributes exp(-decay * d/radius) instead of 1.
    A feature at the center contributes 1.0; at the edge ~0.05.
    Features without coordinates contribute 0.5 (mid-weight fallback).
    """
    total = 0.0
    for f in features:
        if f.lat is not None and f.lon is not None:
            d = haversine_distance(center_lat, center_lon, f.lat, f.lon)
            total += distance_decay(d, radius_m, decay_rate)
        else:
            total += 0.5  # Way centroid unavailable — use mid-weight
    return round(total, 4)


# ── Road hierarchy ─────────────────────────────────────────────────────────────

ROAD_WEIGHTS: dict[str, float] = {
    "motorway":       1.00,
    "motorway_link":  0.90,
    "trunk":          0.90,
    "trunk_link":     0.80,
    "primary":        0.80,
    "primary_link":   0.70,
    "secondary":      0.60,
    "secondary_link": 0.55,
    "tertiary":       0.40,
    "tertiary_link":  0.35,
    "residential":    0.25,
    "living_street":  0.20,
    "service":        0.15,
    "unclassified":   0.20,
    "pedestrian":     0.10,
    "path":           0.05,
    "footway":        0.05,
    "cycleway":       0.05,
    "track":          0.10,
}
_DEFAULT_ROAD_WEIGHT = 0.15


def get_road_weight(highway_tag: str) -> float:
    """Quality weight for a road type. Unknown types use the default."""
    return ROAD_WEIGHTS.get((highway_tag or "").lower(), _DEFAULT_ROAD_WEIGHT)


def compute_road_quality(
    road_features: list,
    center_lat: float,
    center_lon: float,
    radius_m: float,
) -> dict[str, Any]:
    """
    Composite road quality metric.

    Returns
    -------
    {
        "quality_score":    float (0-100),
        "road_type_counts": {"primary": 3, "secondary": 5, ...},
        "dominant_road_type": str,
        "high_quality_roads": int,     # motorway/trunk/primary/secondary
        "total_roads":      int,
    }
    """
    road_type_counts: dict[str, int] = {}
    weighted_quality = 0.0
    max_possible     = 0.0
    high_quality     = 0

    for f in road_features:
        highway = f.tags.get("highway", "") if f.tags else ""
        weight  = get_road_weight(highway)
        road_class = highway or "unclassified"
        road_type_counts[road_class] = road_type_counts.get(road_class, 0) + 1

        if highway in ("motorway", "trunk", "primary", "secondary",
                       "motorway_link", "trunk_link", "primary_link", "secondary_link"):
            high_quality += 1

        if f.lat is not None and f.lon is not None:
            d = haversine_distance(center_lat, center_lon, f.lat, f.lon)
            dw = distance_decay(d, radius_m)
        else:
            dw = 0.5  # Unknown location

        weighted_quality += weight * dw
        max_possible     += 1.0 * dw  # max road weight = 1.0

    quality_score = min(weighted_quality / max_possible * 100, 100.0) if max_possible > 0 else 0.0
    dominant = max(road_type_counts, key=road_type_counts.get) if road_type_counts else None

    return {
        "quality_score":     round(quality_score, 2),
        "road_type_counts":  road_type_counts,
        "dominant_road_type": dominant,
        "high_quality_roads": high_quality,
        "total_roads":       len(road_features),
    }


# ── Competition sub-type detection ────────────────────────────────────────────

# OSM tag filters per business type — list of {key: value} dicts (OR logic)
COMPETITOR_TAGS: dict[str, list[dict[str, str]]] = {
    "retail": [
        {"shop": "supermarket"},
        {"shop": "mall"},
        {"shop": "convenience"},
        {"shop": "department_store"},
        {"amenity": "marketplace"},
        {"shop": "clothes"},
        {"shop": "electronics"},
        {"shop": "furniture"},
    ],
    "hospital": [
        {"amenity": "hospital"},
        {"amenity": "clinic"},
        {"amenity": "doctors"},
        {"healthcare": "hospital"},
        {"healthcare": "clinic"},
    ],
    "ev_station": [
        {"amenity": "charging_station"},
    ],
    "warehouse": [
        {"landuse": "industrial"},
        {"building": "warehouse"},
        {"building": "industrial"},
        {"landuse": "logistics"},
    ],
    "telecom":   [],   # No reliable OSM tag
    "renewable": [],   # No reliable OSM tag
    "generic":   [],
}


def detect_competitors(
    features_by_category: dict,   # dict[str, list[GeoFeature]]
    business_type: str,
    center_lat: float,
    center_lon: float,
    radius_m: float,
) -> dict[str, Any]:
    """
    Detect and count direct competitors from OSM tags.

    Returns
    -------
    {
        "competitor_count":     int,
        "competitor_breakdown": {"shop=supermarket": 3, ...},
        "weighted_competitor_count": float,
    }
    """
    tag_filters = COMPETITOR_TAGS.get(business_type, [])
    if not tag_filters:
        return {
            "competitor_count": 0,
            "competitor_breakdown": {},
            "weighted_competitor_count": 0.0,
        }

    count        = 0
    weighted     = 0.0
    breakdown: dict[str, int] = {}

    all_features = [f for feats in features_by_category.values() for f in feats]

    for feat in all_features:
        if not feat.tags:
            continue
        matched = False
        for tag_filter in tag_filters:
            for k, v in tag_filter.items():
                if feat.tags.get(k) == v:
                    count += 1
                    key = f"{k}={v}"
                    breakdown[key] = breakdown.get(key, 0) + 1
                    if feat.lat is not None and feat.lon is not None:
                        d = haversine_distance(center_lat, center_lon, feat.lat, feat.lon)
                        weighted += distance_decay(d, radius_m)
                    else:
                        weighted += 0.5
                    matched = True
                    break
            if matched:
                break

    return {
        "competitor_count":          count,
        "competitor_breakdown":      breakdown,
        "weighted_competitor_count": round(weighted, 3),
    }


# ── Density metrics helper ────────────────────────────────────────────────────

def compute_all_densities(
    feature_counts: dict[str, int],
    radius_m: float,
) -> dict[str, float]:
    """Return per-category density (features / km²) for all categories."""
    return {cat: compute_density(count, radius_m) for cat, count in feature_counts.items()}
