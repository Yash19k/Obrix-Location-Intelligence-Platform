"""
intelligence/scoring/confidence.py

ConfidenceCalculator — assesses how reliable the computed score is.

A score based on 600 real OSM features is more trustworthy than one based
on 3 features. Confidence reflects data completeness, not score magnitude.

Factors that reduce confidence
--------------------------------
- OSM query error (major penalty)
- Very few total features (data-sparse area)
- Key categories completely missing (hospitals, roads)
- Very short query time (possible empty response)
- Score computed from count-only data (no distance enrichment)

Confidence is returned as a 0–100 float and included in the API response.
"""

from __future__ import annotations

from typing import Any


class ConfidenceCalculator:
    """
    Computes a confidence score (0–100) for a completed analysis.

    High confidence (≥ 80): rich OSM data, no errors, key categories present.
    Medium confidence (50-79): some missing categories or sparse data.
    Low confidence (< 50): error, very few features, or critical gaps.
    """

    # Minimum expected feature counts for full confidence in each category
    _EXPECTED_COUNTS: dict[str, int] = {
        "roads":         10,
        "restaurants":    5,
        "banks":          2,
        "bus_stops":      2,
        "hospitals":      1,
        "schools":        1,
        "fuel_stations":  1,
        "parks":          1,
    }

    # Categories whose complete absence causes a larger penalty
    _CRITICAL = frozenset({"roads", "hospitals"})

    @classmethod
    def calculate(
        cls,
        feature_counts: dict[str, int],
        osm_error: str | None,
        total_features: int,
        is_enriched: bool = False,
        osm_source: str = "overpass",
    ) -> dict[str, Any]:
        """
        Calculate confidence for one analysis result.

        Parameters
        ----------
        feature_counts : dict[str, int]
        osm_error : str | None
            If set, an OSM query error occurred.
        total_features : int
            Total GeoFeature objects returned.
        is_enriched : bool
            Whether distance-enriched data was available to factors.
        osm_source : str
            "overpass" or "cache".

        Returns
        -------
        {
            "score":       float (0–100),
            "label":       str  ("High" / "Medium" / "Low"),
            "penalties":   list[str],   # human-readable penalty reasons
            "is_enriched": bool,
        }
        """
        score    = 100.0
        penalties: list[str] = []

        # ── Hard penalties ────────────────────────────────────────────────────

        if osm_error:
            score -= 40.0
            penalties.append(f"OSM query error: {osm_error[:80]}")

        if total_features == 0:
            score -= 35.0
            penalties.append("No features returned from Overpass")
        elif total_features < 10:
            score -= 20.0
            penalties.append(f"Very sparse data ({total_features} features)")
        elif total_features < 30:
            score -= 10.0
            penalties.append(f"Sparse data ({total_features} features)")

        # ── Per-category completeness ─────────────────────────────────────────

        for cat, expected in cls._EXPECTED_COUNTS.items():
            actual = feature_counts.get(cat, 0)
            if actual == 0:
                penalty = 8.0 if cat in cls._CRITICAL else 3.0
                score -= penalty
                penalties.append(f"No {cat} detected")
            elif actual < expected:
                fraction = actual / expected
                penalty = (1.0 - fraction) * (5.0 if cat in cls._CRITICAL else 2.0)
                score -= penalty

        # ── Bonuses ───────────────────────────────────────────────────────────

        if is_enriched:
            score += 5.0   # Distance-aware scoring is more reliable

        if osm_source == "cache":
            score += 2.0   # Cache = verified data from a prior successful query

        score = max(0.0, min(100.0, score))

        if score >= 75:
            label = "High"
        elif score >= 50:
            label = "Medium"
        else:
            label = "Low"

        return {
            "score":       round(score, 1),
            "label":       label,
            "penalties":   penalties,
            "is_enriched": is_enriched,
        }
