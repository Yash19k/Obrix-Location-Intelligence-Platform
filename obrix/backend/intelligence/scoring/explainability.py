"""
intelligence/scoring/explainability.py

ExplainabilityBuilder — generates rich, human-readable factor explanations.

DESIGN: Factor classes return raw metrics + score + metadata.
They do NOT generate explanation strings.
ExplainabilityBuilder converts those metrics into natural language.

This separation means:
  - Factors stay simple (pure scoring functions)
  - Explanation templates can be updated without touching scoring logic
  - Phase 5: swap templates for LLM-generated explanations (one file change)
"""

from __future__ import annotations

from typing import Any


def _fmt_dist(metres: float | None) -> str:
    """Format a distance in metres, switching to km when appropriate."""
    if metres is None:
        return "unknown distance"
    if metres < 1000:
        return f"{metres:.0f}m"
    return f"{metres / 1000:.1f}km"


def _fmt_density(density: float) -> str:
    return f"{density:.1f}/km²"


class ExplainabilityBuilder:
    """
    Converts raw factor metrics into human-readable explanations.

    Usage (inside the engine):

        builder = ExplainabilityBuilder(context)
        explanation = builder.build("accessibility", raw_factor_output)
    """

    def __init__(self, context: dict[str, Any]):
        """
        Parameters
        ----------
        context : dict
            Shared analysis context computed once by the engine:
            {
                "lat": float,
                "lon": float,
                "radius_m": float,
                "business_type": str,
                "density_metrics": {...},
                "distance_metrics": {...},
                "road_hierarchy": {...},
                "competition_metrics": {...},
            }
        """
        self._ctx = context

    def build(self, factor_key: str, raw: dict[str, Any]) -> str:
        """
        Generate an explanation for one factor.

        Falls back to a generic explanation if no template exists.
        """
        method = getattr(self, f"_explain_{factor_key}", None)
        if callable(method):
            return method(raw)
        return self._generic(factor_key, raw)

    # ── Factor-specific templates ─────────────────────────────────────────────

    def _explain_accessibility(self, raw: dict) -> str:
        score   = raw.get("score", 0)
        inputs  = raw.get("inputs", {})
        roads   = inputs.get("roads",     0)
        stops   = inputs.get("bus_stops", 0)
        rh      = self._ctx.get("road_hierarchy", {})
        label   = rh.get("road_quality_label", "")
        dominant = rh.get("dominant_type", "")
        nearest_major = rh.get("nearest_major_m")

        parts = []
        if roads > 0:
            dom_str = f" (dominant: {dominant})" if dominant else ""
            parts.append(f"{roads} road segments{dom_str}")
        if stops > 0:
            parts.append(f"{stops} bus stop(s)")
        if nearest_major:
            parts.append(f"nearest major road {_fmt_dist(nearest_major)} away")

        base = f"Road quality: {label}. " if label else ""
        features_str = ", ".join(parts) if parts else "no road or transit data"
        return f"{base}{features_str.capitalize()} contribute to a {self._tier(score)} accessibility score."

    def _explain_infrastructure(self, raw: dict) -> str:
        score   = raw.get("score", 0)
        inputs  = raw.get("inputs", {})
        dm      = self._ctx.get("distance_metrics", {})
        hosp    = inputs.get("hospitals",     0)
        schools = inputs.get("schools",       0)
        banks   = inputs.get("banks",         0)
        fuel    = inputs.get("fuel_stations", 0)

        hosp_dist  = dm.get("hospitals",     {}).get("nearest_distance")
        school_dist = dm.get("schools",      {}).get("nearest_distance")

        strengths, gaps = [], []
        if hosp > 0:
            s = f"{hosp} hospital(s)"
            if hosp_dist:
                s += f" (nearest {_fmt_dist(hosp_dist)})"
            strengths.append(s)
        else:
            gaps.append("no hospitals")

        if schools > 0:
            s = f"{schools} school(s)"
            if school_dist:
                s += f" (nearest {_fmt_dist(school_dist)})"
            strengths.append(s)
        else:
            gaps.append("no schools")

        if banks > 0:
            strengths.append(f"{banks} bank(s)/ATM(s)")
        if fuel > 0:
            strengths.append(f"{fuel} fuel station(s)")

        tier = self._tier(score)
        if strengths and not gaps:
            return f"Strong infrastructure — {', '.join(strengths)}. {tier} readiness."
        if gaps and not strengths:
            return f"Limited infrastructure — {', '.join(gaps)} detected. {tier} readiness."
        s_str = ", ".join(strengths) if strengths else "no key services"
        g_str = ", ".join(gaps) if gaps else ""
        return f"{tier} infrastructure: {s_str}. Missing: {g_str}."

    def _explain_commercial(self, raw: dict) -> str:
        score   = raw.get("score", 0)
        inputs  = raw.get("inputs", {})
        dens    = self._ctx.get("density_metrics", {})
        rests   = inputs.get("restaurants", 0)
        banks   = inputs.get("banks",       0)
        r_dens  = dens.get("restaurants",   0.0)

        tier = self._tier(score)
        if rests == 0 and banks == 0:
            return f"Low commercial activity — no dining or banking services detected."
        parts = []
        if rests > 0:
            parts.append(f"{rests} restaurant(s) ({_fmt_density(r_dens)})")
        if banks > 0:
            parts.append(f"{banks} bank(s)")
        return f"{tier} commercial activity — {', '.join(parts)}."

    def _explain_competition(self, raw: dict) -> str:
        score   = raw.get("score", 0)
        cm      = self._ctx.get("competition_metrics", {})
        count   = cm.get("competitor_count",          0)
        wc      = cm.get("weighted_competitor_count",  0.0)
        bd      = cm.get("competitor_breakdown",       {})
        btype   = self._ctx.get("business_type",       "generic")

        tier = self._tier(score)
        if count == 0:
            return (
                f"No direct competitors detected for {btype} in the analysis area. "
                f"{tier} competitive position."
            )
        top = max(bd, key=bd.get) if bd else ""
        top_str = f" ({bd[top]} × {top})" if top else ""
        return (
            f"{count} potential competitor(s){top_str} detected. "
            f"Weighted proximity pressure: {wc:.1f}. {tier} competitive landscape."
        )

    def _explain_environment(self, raw: dict) -> str:
        score  = raw.get("score", 0)
        inputs = raw.get("inputs", {})
        parks  = inputs.get("parks", 0)
        dm     = self._ctx.get("distance_metrics", {})
        park_dist = dm.get("parks", {}).get("nearest_distance")

        tier = self._tier(score)
        if parks == 0:
            return (
                f"No parks detected within the search radius. "
                f"Environmental assessment will improve with satellite/NDVI data in Phase 4."
            )
        dist_str = f" (nearest {_fmt_dist(park_dist)})" if park_dist else ""
        return (
            f"{parks} park(s){dist_str} provide green space. "
            f"{tier} environmental suitability. "
            f"Full assessment (air quality, NDVI) coming in Phase 4."
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _tier(score: float) -> str:
        if score >= 80:
            return "Excellent"
        if score >= 60:
            return "Good"
        if score >= 40:
            return "Fair"
        if score >= 20:
            return "Low"
        return "Very low"

    @staticmethod
    def _generic(factor_key: str, raw: dict) -> str:
        score = raw.get("score", 0)
        label = factor_key.replace("_", " ").title()
        if score >= 75:
            return f"{label}: High ({score:.0f}/100)."
        if score >= 50:
            return f"{label}: Medium ({score:.0f}/100)."
        return f"{label}: Low ({score:.0f}/100) — limited data available."
