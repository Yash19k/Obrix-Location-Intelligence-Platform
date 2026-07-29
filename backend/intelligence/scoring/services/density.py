"""
intelligence/scoring/services/density.py

DensityService — converts raw feature counts into spatial density metrics.

Density (features per km²) is more meaningful than raw count because it
normalises for the analysis radius. A count of 50 restaurants within 500m
(density ≈ 63/km²) is very different from 50 within 2km (density ≈ 4/km²).
"""

from __future__ import annotations

import math


class DensityService:
    """
    Computes spatial density metrics for a circular analysis area.

    All methods are pure functions — no state, no Django, no DB.
    """

    @staticmethod
    def area_km2(radius_m: float) -> float:
        """Circular area in km² for the given radius in metres."""
        return math.pi * (radius_m / 1000.0) ** 2

    @classmethod
    def density(cls, count: int, radius_m: float) -> float:
        """Features per km²."""
        area = cls.area_km2(radius_m)
        return round(count / area, 4) if area > 0 else 0.0

    @classmethod
    def density_all(cls, counts: dict[str, int], radius_m: float) -> dict[str, float]:
        """Return per-category density dict for all provided counts."""
        return {cat: cls.density(cnt, radius_m) for cat, cnt in counts.items()}

    @classmethod
    def density_label(cls, density_per_km2: float, thresholds: tuple[float, float, float]) -> str:
        """
        Human-readable density tier label.

        Args:
            density_per_km2: computed density
            thresholds: (low, medium, high) — values >= high → 'Very High'
        """
        low, medium, high = thresholds
        if density_per_km2 >= high:
            return "Very High"
        if density_per_km2 >= medium:
            return "High"
        if density_per_km2 >= low:
            return "Moderate"
        return "Low"

    @classmethod
    def summary(cls, counts: dict[str, int], radius_m: float) -> dict:
        """
        Full density summary for all categories.

        Returns:
            {
                "radius_m":   1000,
                "area_km2":   3.14,
                "densities":  {"restaurants": 18.4, "hospitals": 0.64, ...},
            }
        """
        return {
            "radius_m":  radius_m,
            "area_km2":  round(cls.area_km2(radius_m), 4),
            "densities": cls.density_all(counts, radius_m),
        }
