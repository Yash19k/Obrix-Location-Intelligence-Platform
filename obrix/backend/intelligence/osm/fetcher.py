"""
OSM Overpass API fetcher.
Phase 5 will implement the real HTTP query logic.
"""

import requests
import logging

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def fetch_nearby_features(lat: float, lon: float, radius_m: int) -> dict:
    """
    Query the Overpass API for geospatial features near the given point.
    Returns normalized GeoJSON-compatible dict.

    Phase 4: Returns stub data.
    Phase 5: Implements real Overpass query.
    """
    # TODO Phase 5: Build Overpass QL query and make HTTP request
    return {
        "stub": True,
        "note": "Phase 5 will fetch real OSM data",
        "roads": [],
        "hospitals": [],
        "schools": [],
        "competitors": [],
        "buildings": [],
    }
