"""
AI Report Generator — builds 13-section McKinsey/Deloitte style business consulting reports.
"""

import json
import logging
from typing import Dict, Any

from .prompt_builder import PromptBuilder
from .groq_service import GroqService

logger = logging.getLogger(__name__)

def safe_float(val, default=0.0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError) as e:
        logger.warning(f"[ReportGenerator] Failed to cast {repr(val)} (type {type(val)}) to float. Using fallback {default}.")
        return default

def safe_int(val, default=0) -> int:
    if val is None:
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError) as e:
        logger.warning(f"[ReportGenerator] Failed to cast {repr(val)} (type {type(val)}) to int. Using fallback {default}.")
        return default

class ReportGenerator:
    @classmethod
    def generate_full_report(cls, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        prompt = PromptBuilder.build_report_prompt(analysis_data)
        raw_ai_text = GroqService.generate_content(prompt)

        if raw_ai_text:
            try:
                parsed = json.loads(raw_ai_text)
                if isinstance(parsed, dict) and "executive_summary" in parsed:
                    return parsed
            except Exception as e:
                logger.warning("Failed to parse Gemini API JSON output: %s", str(e))

        # Fallback to local expert consulting engine if API key missing or raw_ai_text invalid
        return cls._generate_consulting_report(analysis_data)

    @classmethod
    def _generate_consulting_report(cls, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        lat = safe_float(analysis_data.get("latitude"), 23.0225)
        lon = safe_float(analysis_data.get("longitude"), 72.5714)
        biz_type = (analysis_data.get("business_type") or "retail").lower()
        biz_title = biz_type.replace("_", " ").title()

        result = analysis_data.get("result") or analysis_data
        score = safe_float(result.get("site_readiness_score"), 65.0)
        breakdown = result.get("score_breakdown", {})
        counts = result.get("feature_counts", {})
        
        meta = result.get("raw_factors", {}).get("_meta", {})
        comp_meta = meta.get("competition_metrics") or result.get("competition_metrics") or {}
        road_meta = meta.get("road_hierarchy") or result.get("road_hierarchy") or {}
        conf_meta = meta.get("confidence") or result.get("confidence") or {}

        # Safe parsing of individual metrics
        accessibility_score = safe_float(breakdown.get('accessibility'), 60.0)
        infrastructure_score = safe_float(breakdown.get('infrastructure'), 55.0)
        commercial_score = safe_float(breakdown.get('commercial'), 50.0)
        competition_score = safe_float(breakdown.get('competition'), 70.0)
        environment_score = safe_float(breakdown.get('environment'), 40.0)

        confidence_score = safe_float(conf_meta.get('score'), 95.0)
        comp_count = safe_int(comp_meta.get("competitor_count"), 0)
        comp_level = comp_meta.get("competition_level", "Low")
        road_label = road_meta.get("road_quality_label", "Good")
        competition_density = safe_float(comp_meta.get('competition_density'), 0.0)

        # Investment Grade Calculation
        if score >= 75.0:
            grade = "A"
            rec = "YES"
            rec_reasoning = f"Exceptional site readiness score ({score:.1f}/100) backed by strong accessibility and dense commercial activity."
        elif score >= 50.0:
            grade = "B"
            rec = "MAYBE"
            rec_reasoning = f"Moderate site readiness score ({score:.1f}/100). Feasible location provided mitigation measures are taken for local competitive and road access constraints."
        else:
            grade = "C"
            rec = "NO"
            rec_reasoning = f"Below target site readiness score ({score:.1f}/100). High infrastructure deficits or competitive saturation pose elevated risk."

        total_features_count = sum(safe_int(v) for v in counts.values())

        return {
            "executive_summary": (
                f"Comprehensive spatial evaluation for setting up a {biz_title} at ({lat:.4f}, {lon:.4f}) in Ahmedabad. "
                f"The target location achieved an overall Site Readiness Score of {score:.1f}/100 with {confidence_score:.0f}% data confidence. "
                f"The area exhibits {road_label.lower()} road connectivity and {comp_level.lower()} competitive saturation."
            ),
            "location_overview": (
                f"The evaluated site is positioned at latitude {lat:.4f}, longitude {lon:.4f} within a 1,000-metre analysis catchment radius. "
                f"A total of {total_features_count} geospatial features were ingested directly from local PostGIS spatial records."
            ),
            "readiness_interpretation": (
                f"The overall Site Readiness Score of {score:.1f}/100 is derived from a 5-factor weighted matrix. "
                f"Accessibility factor contributed {accessibility_score:.1f}/100, Infrastructure contributed {infrastructure_score:.1f}/100, "
                f"Commercial Density contributed {commercial_score:.1f}/100, Competition contributed {competition_score:.1f}/100, "
                f"and Environment contributed {environment_score:.1f}/100."
            ),
            "infrastructure_analysis": (
                f"Local infrastructure features within 1km radius include {safe_int(counts.get('roads'))} road network segments, "
                f"{safe_int(counts.get('hospitals'))} healthcare facilities, {safe_int(counts.get('schools'))} educational hubs, "
                f"{safe_int(counts.get('restaurants'))} food & dining spots, {safe_int(counts.get('banks'))} banks/ATMs, and "
                f"{safe_int(counts.get('bus_stops'))} transit stops."
            ),
            "accessibility_analysis": (
                f"Road hierarchy classification indicates {road_label.lower()} overall connectivity. "
                f"Proximity to primary road arteries ensures optimal vehicular access for customers and service logistics."
            ),
            "competitor_analysis": (
                f"Spatial competitor detection identified {comp_count} direct competitor sites matching the '{biz_type}' tag profile within the catchment zone. "
                f"The competitive saturation level is classified as '{comp_level}' with a density of {competition_density:.2f} competitors per km²."
            ),
            "nearby_amenities_summary": (
                f"High-signal amenity density is led by dining ({safe_int(counts.get('restaurants'))}) and commercial financial services ({safe_int(counts.get('banks'))}). "
                f"This combination provides strong daytime footfall drivers for commercial operations."
            ),
            "swot": {
                "strengths": [
                    f"Strong baseline accessibility ({accessibility_score:.1f}/100)",
                    f"Dense road network ({safe_int(counts.get('roads'))} segments identified)",
                    f"{'Low' if comp_count <= 2 else 'Moderate'} market competitor pressure"
                ],
                "weaknesses": [
                    f"Environmental green space index ({environment_score:.1f}/100)",
                    f"{'Transit stop density can be improved' if safe_int(counts.get('bus_stops')) < 3 else 'Peak hour traffic congestion'}"
                ],
                "opportunities": [
                    "Target emerging daytime commuter demographic",
                    "Develop strategic co-marketing partnerships with surrounding commercial hubs",
                    "Capitalize on gap in local premium service offerings"
                ],
                "threats": [
                    "New competitor entry into immediate 500m radius",
                    "Municipal road widening or construction disruptions"
                ]
            },
            "risk_assessment": {
                "business_risks": "Risk of shifting customer traffic towards adjacent commercial nodes.",
                "accessibility_risks": "Peak traffic delays during morning and evening rush hours.",
                "infrastructure_risks": "Utility or grid dependency during peak operating hours.",
                "market_risks": "Price sensitivity of local residential catchment."
            },
            "investment_recommendation": {
                "grade": grade,
                "recommendation": rec,
                "reasoning": rec_reasoning
            },
            "business_strategy": {
                "target_customers": f"Primary: Working professionals, university students, and residential families within 1.5km.",
                "marketing_ideas": [
                    "Hyper-local digital geo-fenced promotions",
                    "Launch opening discounts for surrounding corporate offices and schools",
                    "Partner with local delivery platforms"
                ],
                "best_operating_hours": "08:00 AM – 10:00 PM (Monday through Sunday)",
                "expansion_opportunities": "Potential for delivery hub expansion or secondary drive-thru pickup counter.",
                "business_improvements": [
                    "Install dedicated customer parking signage",
                    "Implement loyalty reward mobile integration"
                ]
            },
            "future_potential": (
                f"The 3-to-5 year growth outlook for this site is positive, driven by urban infill and ongoing commercial development in the surrounding catchment."
            ),
            "final_conclusion": (
                f"In conclusion, the location at ({lat:.4f}, {lon:.4f}) represents an Investment Grade '{grade}' opportunity. "
                f"Final Recommendation: {rec}."
            )
        }
