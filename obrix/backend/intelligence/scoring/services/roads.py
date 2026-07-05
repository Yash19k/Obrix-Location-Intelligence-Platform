"""
intelligence/scoring/services/roads.py

RoadService — road hierarchy analysis for accessibility scoring.

Road quality is assessed by:
  1. Road type weights (motorway > trunk > primary > … > footway)
  2. Distance weighting (closer roads matter more)
  3. Presence of high-quality connector roads (primary / secondary)
"""

from __future__ import annotations

from typing import Any

from intelligence.scoring.normalization import distance_decay


# ── Road quality weights ──────────────────────────────────────────────────────
# Higher weight = better quality / more accessible

ROAD_QUALITY_WEIGHTS: dict[str, float] = {
    "motorway":        1.00,
    "motorway_link":   0.90,
    "trunk":           0.90,
    "trunk_link":      0.80,
    "primary":         0.80,
    "primary_link":    0.70,
    "secondary":       0.60,
    "secondary_link":  0.55,
    "tertiary":        0.40,
    "tertiary_link":   0.35,
    "residential":     0.25,
    "living_street":   0.20,
    "service":         0.15,
    "unclassified":    0.20,
    "pedestrian":      0.10,
    "path":            0.05,
    "footway":         0.05,
    "cycleway":        0.05,
    "track":           0.10,
}

_HIGH_QUALITY = frozenset({
    "motorway", "motorway_link", "trunk", "trunk_link",
    "primary", "primary_link", "secondary", "secondary_link",
})
_DEFAULT_WEIGHT = 0.15


class RoadService:
    """
    Analyses road features to produce quality and hierarchy metrics.

    All methods are pure functions.
    """

    @staticmethod
    def get_highway_tag(feature: Any) -> str:
        """Extract the OSM highway tag from a GeoFeature."""
        if feature.tags:
            return feature.tags.get("highway", "")
        return ""

    @classmethod
    def quality_weight(cls, highway_tag: str) -> float:
        """Return the quality weight for a road type."""
        return ROAD_QUALITY_WEIGHTS.get(highway_tag.lower() if highway_tag else "", _DEFAULT_WEIGHT)

    @classmethod
    def analyse(
        cls,
        road_features: list,
        center_lat: float,
        center_lon: float,
        radius_m: float,
        distance_service: Any = None,
    ) -> dict[str, Any]:
        """
        Full road hierarchy analysis.

        Parameters
        ----------
        road_features : list[GeoFeature]
        center_lat, center_lon : float
            Analysis point.
        radius_m : float
            Search radius in metres (for distance decay denominator).
        distance_service : DistanceService | None
            Injected distance service. Defaults to Haversine internally.

        Returns
        -------
        {
            "quality_score":      float (0–100),
            "road_type_counts":   {"primary": 3, "secondary": 5, ...},
            "dominant_type":      str,
            "high_quality_count": int,
            "total_roads":        int,
            "nearest_primary_m":  float | None,
            "nearest_major_m":    float | None,
            "road_quality_label": str,   # "Excellent" / "Good" / "Fair" / "Poor"
        }
        """
        if distance_service is None:
            from intelligence.scoring.services.distance import get_distance_service
            distance_service = get_distance_service()

        road_type_counts: dict[str, int] = {}
        weighted_quality = 0.0
        max_possible     = 0.0
        high_quality     = 0
        nearest_primary  = None
        nearest_major    = None

        for f in road_features:
            highway = cls.get_highway_tag(f)
            weight  = cls.quality_weight(highway)
            road_class = highway or "unclassified"
            road_type_counts[road_class] = road_type_counts.get(road_class, 0) + 1

            if highway in _HIGH_QUALITY:
                high_quality += 1

            if f.lat is not None and f.lon is not None:
                d = distance_service.distance(center_lat, center_lon, f.lat, f.lon)
                dw = distance_decay(d, radius_m)

                if highway in ("primary", "primary_link"):
                    nearest_primary = min(nearest_primary, d) if nearest_primary else d
                if highway in _HIGH_QUALITY:
                    nearest_major = min(nearest_major, d) if nearest_major else d
            else:
                dw = 0.5

            weighted_quality += weight * dw
            max_possible     += 1.0 * dw

        quality_score = (
            min(weighted_quality / max_possible * 100, 100.0)
            if max_possible > 0 else 0.0
        )
        dominant = max(road_type_counts, key=road_type_counts.get) if road_type_counts else None

        if quality_score >= 70:
            label = "Excellent"
        elif quality_score >= 50:
            label = "Good"
        elif quality_score >= 30:
            label = "Fair"
        else:
            label = "Poor"

        return {
            "quality_score":      round(quality_score, 2),
            "road_type_counts":   road_type_counts,
            "dominant_type":      dominant,
            "high_quality_count": high_quality,
            "total_roads":        len(road_features),
            "nearest_primary_m":  round(nearest_primary, 1) if nearest_primary else None,
            "nearest_major_m":    round(nearest_major, 1) if nearest_major else None,
            "road_quality_label": label,
        }
