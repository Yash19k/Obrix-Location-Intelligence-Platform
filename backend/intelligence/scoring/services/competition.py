"""
intelligence/scoring/services/competition.py

CompetitionService — detects direct competitors from OSM tags.

Rules are configured per business type; zero hardcoded logic lives here.
Add a new business type by adding an entry to COMPETITOR_PROFILES below.
"""

from __future__ import annotations

from typing import Any


# ── Competitor tag profiles ───────────────────────────────────────────────────
# Each entry is a list of {tag_key: tag_value} dicts.
# A feature matches if ANY dict in the list matches (OR logic).

COMPETITOR_PROFILES: dict[str, list[dict[str, str]]] = {
    "retail": [
        {"shop":   "supermarket"},
        {"shop":   "mall"},
        {"shop":   "convenience"},
        {"shop":   "department_store"},
        {"amenity":"marketplace"},
        {"shop":   "clothes"},
        {"shop":   "electronics"},
        {"shop":   "furniture"},
        {"shop":   "hardware"},
    ],
    "hospital": [
        {"amenity": "hospital"},
        {"amenity": "clinic"},
        {"amenity": "doctors"},
        {"amenity": "nursing_home"},
        {"healthcare": "hospital"},
        {"healthcare": "clinic"},
    ],
    "cafe": [
        {"amenity": "cafe"},
        {"amenity": "fast_food"},
        {"shop": "coffee"},
        {"amenity": "bakery"},
        {"shop": "bakery"},
    ],
    "restaurant": [
        {"amenity": "restaurant"},
        {"amenity": "fast_food"},
        {"amenity": "food_court"},
        {"amenity": "pub"},
        {"amenity": "bar"},
    ],
    "pharmacy": [
        {"amenity": "pharmacy"},
        {"shop": "chemist"},
        {"shop": "medical_supply"},
    ],
    "bank": [
        {"amenity": "bank"},
        {"amenity": "atm"},
        {"amenity": "bureau_de_change"},
    ],
    "school": [
        {"amenity": "school"},
        {"amenity": "college"},
        {"amenity": "university"},
        {"amenity": "kindergarten"},
    ],
    "fuel": [
        {"amenity": "fuel"},
    ],
    "ev_station": [
        {"amenity": "charging_station"},
    ],
    "warehouse": [
        {"landuse":  "industrial"},
        {"building": "warehouse"},
        {"building": "industrial"},
        {"landuse":  "logistics"},
    ],
    "telecom": [
        {"man_made": "tower"},
        {"man_made": "mast"},
    ],
    "renewable": [
        {"power":   "plant"},
        {"generator:source": "solar"},
        {"generator:source": "wind"},
    ],
    "generic": [],
}


class CompetitionService:
    """
    Detects and quantifies direct competitors for a given business type.

    All logic is driven by COMPETITOR_PROFILES — no if/else per business type.
    """

    @classmethod
    def get_profiles(cls, business_type: str) -> list[dict[str, str]]:
        """Return tag-match profiles for the given business type."""
        return COMPETITOR_PROFILES.get(business_type, COMPETITOR_PROFILES.get("generic", []))

    @classmethod
    def detect(
        cls,
        features_by_category: dict,    # dict[str, list[GeoFeature]]
        business_type: str,
        center_lat: float,
        center_lon: float,
        radius_m: float,
        distance_service: Any = None,
    ) -> dict[str, Any]:
        """
        Count and weight competitors found in all feature categories.

        Returns
        -------
        {
            "competitor_count":           int,
            "competitor_breakdown":       {"shop=supermarket": 2, ...},
            "weighted_competitor_count":  float,
            "has_direct_competitors":     bool,
            "competition_level":          "Low" | "Medium" | "High",
            "competition_density":        float,
            "nearest_distance_m":         float | None,
            "avg_distance_m":             float | None,
            "competitors":                [{"name": str, "distance_m": float, "lat": float, "lon": float, "tag": str}],
        }
        """
        if distance_service is None:
            from intelligence.scoring.services.distance import get_distance_service
            distance_service = get_distance_service()

        import math
        from intelligence.scoring.normalization import distance_decay

        profiles = cls.get_profiles(business_type)
        area_km2 = math.pi * ((radius_m / 1000.0) ** 2)

        if not profiles:
            return {
                "competitor_count":          0,
                "competitor_breakdown":      {},
                "weighted_competitor_count": 0.0,
                "has_direct_competitors":    False,
                "competition_level":          "Low",
                "competition_density":        0.0,
                "nearest_distance_m":         None,
                "avg_distance_m":             None,
                "competitors":                [],
            }

        count        = 0
        weighted     = 0.0
        breakdown: dict[str, int] = {}
        competitor_items: list[dict[str, Any]] = []
        distances: list[float] = []

        all_features = [f for feats in features_by_category.values() for f in feats]

        for feat in all_features:
            if not feat.tags:
                continue
            for profile in profiles:
                matched = False
                for k, v in profile.items():
                    if feat.tags.get(k) == v:
                        count += 1
                        label = f"{k}={v}"
                        breakdown[label] = breakdown.get(label, 0) + 1
                        
                        dist_val = None
                        if feat.lat is not None and feat.lon is not None:
                            dist_val = distance_service.distance(center_lat, center_lon, feat.lat, feat.lon)
                            distances.append(dist_val)
                            weighted += distance_decay(dist_val, radius_m)
                        else:
                            weighted += 0.5

                        competitor_name = feat.name or f"{business_type.replace('_', ' ').title()} ({v})"
                        competitor_items.append({
                            "name": competitor_name,
                            "distance_m": round(dist_val, 1) if dist_val is not None else None,
                            "lat": feat.lat,
                            "lon": feat.lon,
                            "tag": label,
                            "category": feat.category,
                        })
                        matched = True
                        break
                if matched:
                    break

        competitor_items.sort(key=lambda x: (x["distance_m"] is None, x["distance_m"] or float("inf")))

        nearest_dist = min(distances) if distances else None
        avg_dist = sum(distances) / len(distances) if distances else None
        density = count / area_km2 if area_km2 > 0 else 0.0

        if count < 3:
            comp_level = "Low"
        elif count <= 8:
            comp_level = "Medium"
        else:
            comp_level = "High"

        return {
            "competitor_count":          count,
            "competitor_breakdown":      breakdown,
            "weighted_competitor_count": round(weighted, 3),
            "has_direct_competitors":    count > 0,
            "competition_level":          comp_level,
            "competition_density":        round(density, 2),
            "nearest_distance_m":         round(nearest_dist, 1) if nearest_dist is not None else None,
            "avg_distance_m":             round(avg_dist, 1) if avg_dist is not None else None,
            "competitors":                competitor_items[:15],
        }
