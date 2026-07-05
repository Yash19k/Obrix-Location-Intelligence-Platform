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
        }
        """
        if distance_service is None:
            from intelligence.scoring.services.distance import get_distance_service
            distance_service = get_distance_service()

        profiles = cls.get_profiles(business_type)
        if not profiles:
            return {
                "competitor_count":          0,
                "competitor_breakdown":      {},
                "weighted_competitor_count": 0.0,
                "has_direct_competitors":    False,
            }

        from intelligence.scoring.normalization import distance_decay

        count        = 0
        weighted     = 0.0
        breakdown: dict[str, int] = {}

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
                        if feat.lat is not None and feat.lon is not None:
                            d = distance_service.distance(center_lat, center_lon, feat.lat, feat.lon)
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
            "has_direct_competitors":    count > 0,
        }
