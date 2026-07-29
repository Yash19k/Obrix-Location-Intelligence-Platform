"""
Default factor weight profiles per business type.

Weights must sum to 1.0 for each business type.
These are the defaults — users can override via WeightConfig model (Phase 6+).
"""

from typing import Dict

DEFAULT_WEIGHTS: Dict[str, Dict[str, float]] = {
    "retail": {
        "accessibility": 0.30,
        "population": 0.25,
        "competition": 0.20,
        "infrastructure": 0.15,
        "land_use": 0.10,
    },
    "hospital": {
        "accessibility": 0.25,
        "population": 0.30,
        "competition": 0.10,
        "infrastructure": 0.25,
        "land_use": 0.10,
    },
    "ev_station": {
        "accessibility": 0.35,
        "population": 0.20,
        "competition": 0.15,
        "infrastructure": 0.20,
        "land_use": 0.10,
    },
    "warehouse": {
        "accessibility": 0.20,
        "population": 0.10,
        "competition": 0.05,
        "infrastructure": 0.40,
        "land_use": 0.25,
    },
    "telecom": {
        "accessibility": 0.15,
        "population": 0.30,
        "competition": 0.15,
        "infrastructure": 0.30,
        "land_use": 0.10,
    },
    "renewable": {
        "accessibility": 0.10,
        "population": 0.05,
        "competition": 0.05,
        "infrastructure": 0.35,
        "land_use": 0.45,
    },
    "generic": {
        "accessibility": 0.25,
        "population": 0.25,
        "competition": 0.20,
        "infrastructure": 0.15,
        "land_use": 0.15,
    },
}


def get_weights(business_type: str) -> Dict[str, float]:
    """Return the weight profile for the given business type, falling back to generic."""
    return DEFAULT_WEIGHTS.get(business_type, DEFAULT_WEIGHTS["generic"])
