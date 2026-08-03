"""
intelligence/scoring/recommendation_engine.py

Recommendation engine for Obrix.
Generates highly specific, contextual, rule-based suitability recommendations.
"""

from typing import List
from .business_profiles import BUSINESS_PROFILES

class RecommendationEngine:
    @staticmethod
    def generate(business_type: str, overall_score: float, top_positive: List[str], top_negative: List[str]) -> str:
        """
        Generates a business-specific, contextual recommendation based on score and factors.
        """
        biz_key = business_type.lower()
        profile = BUSINESS_PROFILES.get(biz_key, BUSINESS_PROFILES["pharmacy"])
        template = profile.get("recommendation_template", "Ideal location based on suitability metrics.")

        if overall_score >= 80:
            rating = "Highly recommended."
            prefix = "Excellent"
        elif overall_score >= 60:
            rating = "Good potential."
            prefix = "Suitable"
        else:
            rating = "Caution advised."
            prefix = "Challenging"

        # Incorporate top positive reason if available
        reason_suffix = ""
        if top_positive:
            # Extract main factor description by stripping out point values
            best_reason = top_positive[0].split(" (+")[0].split(" (")[0]
            reason_suffix = f" backed by strong {best_reason.lower()}."

        return f"{rating} {template}{reason_suffix}"
