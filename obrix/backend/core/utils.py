"""
Shared utility functions — no Django or DRF imports to keep this testable.
"""

import math
from typing import Tuple


# Earth radius in meters (WGS84 mean)
EARTH_RADIUS_M = 6_371_000


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth.
    Returns distance in meters.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def validate_coordinates(latitude: float, longitude: float) -> Tuple[bool, str]:
    """
    Validate that lat/lon are within valid WGS84 bounds.
    Returns (is_valid: bool, error_message: str).
    """
    if not (-90 <= latitude <= 90):
        return False, f"Latitude must be between -90 and 90. Got {latitude}."
    if not (-180 <= longitude <= 180):
        return False, f"Longitude must be between -180 and 180. Got {longitude}."
    return True, ""


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp a value to [min_val, max_val]."""
    return max(min_val, min(max_val, value))


def normalize_score(raw: float, min_raw: float, max_raw: float) -> float:
    """
    Linearly normalize raw value to 0–100.
    If min_raw == max_raw, returns 50 to avoid division by zero.
    """
    if max_raw == min_raw:
        return 50.0
    normalized = (raw - min_raw) / (max_raw - min_raw) * 100
    return clamp(normalized, 0.0, 100.0)
