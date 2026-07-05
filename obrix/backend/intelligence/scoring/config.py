"""
intelligence/scoring/config.py

Single source of truth for all scoring thresholds and weight profiles.

Phase 3 Final additions
-----------------------
- DENSITY_THRESHOLDS: per-category saturation in features/km² (for log normalization)
- DISTANCE_DECAY_RATE: controls how quickly distant features lose influence
- Updated COMPETITION_RULES: now supports tag-based detection (see metrics.py)
- All numerical constants are in this file; road weights live in metrics.ROAD_WEIGHTS.
"""

from __future__ import annotations

# ── Factor saturation thresholds ──────────────────────────────────────────────
# Each threshold represents the count at which a factor sub-score reaches 100.
# Counts above the threshold are clamped to 100 (not penalised further).
#
# Values were calibrated against a sample of 20 Indian cities at 1km radius.
# Adjust RADIUS_REFERENCE_M if your typical radius differs significantly.

RADIUS_REFERENCE_M: int = 1000

# Decay rate for distance-weighting:
# higher = features at the edge of the radius contribute much less.
# At decay=3.0: d=0 → weight=1.0, d=radius/2 → weight=0.22, d=radius → weight=0.05
DISTANCE_DECAY_RATE: float = 3.0

FACTOR_THRESHOLDS: dict[str, dict] = {

    # ── Accessibility ─────────────────────────────────────────────────────────
    "accessibility": {
        "roads_saturation":     30,   # road segments at which roads score = 100
        "bus_stops_saturation": 10,   # bus stops at which transit score = 100
        "roads_weight":         0.60, # weight of roads within accessibility
        "bus_stops_weight":     0.40,
    },

    # ── Infrastructure ────────────────────────────────────────────────────────
    "infrastructure": {
        "hospitals_saturation":     3,
        "schools_saturation":       8,
        "banks_saturation":         15,
        "fuel_stations_saturation": 5,
        # Sub-weights within infrastructure
        "hospitals_weight":         0.35,
        "schools_weight":           0.25,
        "banks_weight":             0.25,
        "fuel_stations_weight":     0.15,
    },

    # ── Commercial Activity ───────────────────────────────────────────────────
    "commercial": {
        "restaurants_saturation": 50,
        "banks_saturation":       15,
        "restaurants_weight":     0.65,
        "banks_weight":           0.35,
    },

    # ── Competition ───────────────────────────────────────────────────────────
    # Rules are business-type specific — see COMPETITION_RULES below.
    "competition": {},

    # ── Environmental Suitability ─────────────────────────────────────────────
    "environment": {
        "parks_saturation": 5,   # parks at which score = 100
        "parks_weight":     1.0,
        "default_score":    50,  # returned when parks data unavailable
    },
}


# ── Competition rules per business type ───────────────────────────────────────
#
# positive_factor: OSM category whose higher count HELPS this business type.
# positive_saturation: count at which the positive signal is maxed out.
# negative_factor: OSM category whose higher count HURTS this business type.
# negative_saturation: count at which the full penalty applies.
# baseline: score when zero positive/negative signals exist.
#
# Formula:
#   score = baseline + positive_bonus - penalty
#   where bonus = (count/saturation).clamp(0,1) * (100 - baseline)
#   and penalty = (count/saturation).clamp(0,1) * baseline

COMPETITION_RULES: dict[str, dict] = {
    "retail": {
        # More restaurants = more foot traffic = better for retail
        "positive_factor":      "restaurants",
        "positive_saturation":  30,
        "positive_weight":      0.70,
        # No specific competitor type tracked via Overpass yet
        "negative_factor":      None,
        "negative_saturation":  0,
        "negative_weight":      0.30,
        "baseline":             50,
    },
    "hospital": {
        # No clear positive signal from OSM data
        "positive_factor":      None,
        "positive_saturation":  0,
        "positive_weight":      0.0,
        # More hospitals = more competition = lower score
        "negative_factor":      "hospitals",
        "negative_saturation":  5,
        "negative_weight":      1.0,
        "baseline":             80,
    },
    "ev_station": {
        # More fuel stations = people understand refuelling = slight positive
        "positive_factor":      "fuel_stations",
        "positive_saturation":  10,
        "positive_weight":      0.50,
        "negative_factor":      None,
        "negative_saturation":  0,
        "negative_weight":      0.50,
        "baseline":             55,
    },
    "warehouse": {
        # Warehouses: roads matter more than competition — neutral competition
        "positive_factor":      None,
        "positive_saturation":  0,
        "positive_weight":      0.0,
        "negative_factor":      None,
        "negative_saturation":  0,
        "negative_weight":      0.0,
        "baseline":             65,
    },
    "telecom": {
        # Bus stops signal population density — good for coverage
        "positive_factor":      "bus_stops",
        "positive_saturation":  15,
        "positive_weight":      0.60,
        "negative_factor":      None,
        "negative_saturation":  0,
        "negative_weight":      0.40,
        "baseline":             50,
    },
    "renewable": {
        # Parks & green space suggest suitable land use
        "positive_factor":      "parks",
        "positive_saturation":  5,
        "positive_weight":      0.70,
        "negative_factor":      None,
        "negative_saturation":  0,
        "negative_weight":      0.30,
        "baseline":             40,
    },
    # Fallback for any unrecognised business type
    "_default": {
        "positive_factor":      None,
        "positive_saturation":  0,
        "positive_weight":      0.0,
        "negative_factor":      None,
        "negative_saturation":  0,
        "negative_weight":      0.0,
        "baseline":             50,
    },
}


# ── Weight profiles per business type ─────────────────────────────────────────
# Weights MUST sum to 1.0.
# Factor keys must match those returned by each factor's .key attribute.

WEIGHT_PROFILES: dict[str, dict[str, float]] = {
    "retail": {
        "accessibility":  0.30,
        "infrastructure": 0.15,
        "commercial":     0.30,
        "competition":    0.15,
        "environment":    0.10,
    },
    "hospital": {
        "accessibility":  0.25,
        "infrastructure": 0.40,
        "commercial":     0.10,
        "competition":    0.15,
        "environment":    0.10,
    },
    "ev_station": {
        "accessibility":  0.40,
        "infrastructure": 0.25,
        "commercial":     0.10,
        "competition":    0.15,
        "environment":    0.10,
    },
    "warehouse": {
        "accessibility":  0.35,
        "infrastructure": 0.30,
        "commercial":     0.05,
        "competition":    0.10,
        "environment":    0.20,
    },
    "telecom": {
        "accessibility":  0.20,
        "infrastructure": 0.30,
        "commercial":     0.15,
        "competition":    0.20,
        "environment":    0.15,
    },
    "renewable": {
        "accessibility":  0.10,
        "infrastructure": 0.25,
        "commercial":     0.05,
        "competition":    0.10,
        "environment":    0.50,
    },
    "generic": {
        "accessibility":  0.25,
        "infrastructure": 0.25,
        "commercial":     0.20,
        "competition":    0.15,
        "environment":    0.15,
    },
}


def get_weight_profile(business_type: str) -> dict[str, float]:
    """Return the weight profile for the given business type, falling back to 'generic'."""
    return WEIGHT_PROFILES.get(business_type, WEIGHT_PROFILES["generic"])


def get_competition_rules(business_type: str) -> dict:
    """Return competition rules for the given business type, falling back to _default."""
    return COMPETITION_RULES.get(business_type, COMPETITION_RULES["_default"])


# ── Density saturation thresholds (features / km²) ───────────────────────────
# At this density the density sub-score reaches 100 (via log normalization).
# Calibrated for typical dense urban areas at 1km radius.

DENSITY_THRESHOLDS: dict[str, float] = {
    "roads":          80.0,    # 80 road segments / km²
    "restaurants":    16.0,    # 16 restaurants / km²
    "banks":           4.0,    # 4 banks / km²
    "bus_stops":       3.0,    # 3 bus stops / km²
    "hospitals":       1.0,    # 1 hospital / km²
    "schools":         2.5,    # 2.5 schools / km²
    "fuel_stations":   1.5,    # 1.5 fuel stations / km²
    "parks":           1.5,    # 1.5 parks / km²
}
