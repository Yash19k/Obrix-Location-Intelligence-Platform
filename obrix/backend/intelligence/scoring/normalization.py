"""
intelligence/scoring/normalization.py

Score normalization utilities.

All functions are pure Python — no Django, no ORM.

Why logarithmic instead of linear?
Linear: count=3, sat=30 → score=10  (1 hospital looks worthless)
Log:    count=3, sat=30 → score=44  (1 hospital is genuinely valuable)

Diminishing returns: the 31st restaurant matters less than the 1st.
"""

from __future__ import annotations

import math


def log_normalize(count: float, saturation: float) -> float:
    """
    Logarithmic normalization.

    - score = 0   when count = 0
    - score = 100 when count = saturation
    - score > 100 clamped to 100 (beyond-saturation not penalised)
    - Diminishing returns: each additional unit counts less

    Args:
        count:      Observed count (raw or weighted).
        saturation: Count at which score reaches 100.

    Returns:
        float in [0, 100]
    """
    if count <= 0 or saturation <= 0:
        return 0.0
    ratio = math.log10(1.0 + float(count)) / math.log10(1.0 + float(saturation))
    return min(ratio, 1.0) * 100.0


def sigmoid_normalize(count: float, midpoint: float, steepness: float = 0.15) -> float:
    """
    Sigmoid (logistic) normalization — S-curve around midpoint.

    - score ≈ 50 at count = midpoint
    - approaches 100 for count >> midpoint
    - approaches 0 for count << midpoint

    Useful for competition scoring where a natural midpoint exists.

    Returns:
        float in (0, 100) — never exactly 0 or 100
    """
    return 100.0 / (1.0 + math.exp(-steepness * (float(count) - float(midpoint))))


def distance_decay(distance_m: float, radius_m: float, decay_rate: float = 3.0) -> float:
    """
    Exponential proximity weight. Nearby features contribute more.

    At distance = 0:          weight = 1.000
    At distance = radius / 2: weight ≈ 0.223
    At distance = radius:     weight ≈ 0.050
    At distance > radius:     weight → 0 (not zero — graceful taper)

    Args:
        distance_m: Distance from the analysis point in metres.
        radius_m:   The analysis radius in metres (denominator).
        decay_rate: Controls steepness (higher = faster decay).

    Returns:
        float in (0, 1]
    """
    return math.exp(-decay_rate * float(distance_m) / max(float(radius_m), 1.0))


def clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    """Clamp value to [lo, hi]."""
    return max(lo, min(hi, value))
