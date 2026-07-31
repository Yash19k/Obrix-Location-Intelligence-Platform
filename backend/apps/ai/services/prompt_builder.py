"""
Prompt Builder for Gemini AI Consulting Engine.
Extracts spatial factors, road hierarchy, competitor density, data confidence,
and site readiness scores to construct a high-context structured prompt.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def safe_float(val, default=0.0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError) as e:
        logger.warning(f"[PromptBuilder] Failed to cast {repr(val)} (type {type(val)}) to float. Using fallback {default}.")
        return default

def safe_int(val, default=0) -> int:
    if val is None:
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError) as e:
        logger.warning(f"[PromptBuilder] Failed to cast {repr(val)} (type {type(val)}) to int. Using fallback {default}.")
        return default

class PromptBuilder:
    @staticmethod
    def build_report_prompt(analysis_data: Dict[str, Any]) -> str:
        """Construct prompt for 13-section comprehensive business report."""
        lat = safe_float(analysis_data.get("latitude"), 23.0225)
        lon = safe_float(analysis_data.get("longitude"), 72.5714)
        biz_type = (analysis_data.get("business_type") or "retail").upper()
        radius = safe_int(analysis_data.get("radius_m"), 1000)

        result = analysis_data.get("result") or analysis_data
        score = safe_float(result.get("site_readiness_score"), 65.0)
        breakdown = result.get("score_breakdown", {})
        counts = result.get("feature_counts", {})
        
        meta = result.get("raw_factors", {}).get("_meta", {})
        comp_meta = meta.get("competition_metrics") or result.get("competition_metrics") or {}
        road_meta = meta.get("road_hierarchy") or result.get("road_hierarchy") or {}
        conf_meta = meta.get("confidence") or result.get("confidence") or {}

        # Safe parsing of breakdown & metrics
        accessibility_score = safe_float(breakdown.get('accessibility'), 60.0)
        infrastructure_score = safe_float(breakdown.get('infrastructure'), 55.0)
        commercial_score = safe_float(breakdown.get('commercial'), 50.0)
        competition_score = safe_float(breakdown.get('competition'), 70.0)
        environment_score = safe_float(breakdown.get('environment'), 40.0)

        confidence_score = safe_float(conf_meta.get('score'), 95.0)
        road_segment_count = safe_int(counts.get('roads'), 0)
        competition_density = safe_float(comp_meta.get('competition_density'), 0.0)

        prompt = f"""
You are a Senior Spatial Strategy Partner at a top tier management consulting firm (McKinsey / Deloitte / PwC style).
Generate an exhaustive, highly professional location intelligence report for a client setting up a {biz_type} at coordinates ({lat:.4f}, {lon:.4f}) in Ahmedabad (Search Radius: {radius}m).

STRICT DATA CONSTRAINTS:
- Base all assertions strictly on the provided spatial data below.
- Do NOT fabricate non-existent transport networks or dummy facts.

SPATIAL DATA MATRIX:
- Overall Site Readiness Score: {score:.1f} / 100
- Business Profile Evaluated: {biz_type}
- Geographic Coordinates: ({lat:.4f}, {lon:.4f})
- Search Radius: {radius} metres
- Data Completeness Confidence: {confidence_score:.0f}% ({conf_meta.get('label', 'High')})

FACTOR SCORE BREAKDOWN:
- Accessibility Score: {accessibility_score:.1f} / 100
- Infrastructure Score: {infrastructure_score:.1f} / 100
- Commercial Activity Score: {commercial_score:.1f} / 100
- Competition Score: {competition_score:.1f} / 100
- Environmental Score: {environment_score:.1f} / 100

INFRASTRUCTURE & NEARBY AMENITIES COUNTS:
- Road Segment Count: {road_segment_count} (Quality Level: {road_meta.get('road_quality_label', 'Good')})
- Hospitals & Healthcare: {safe_int(counts.get('hospitals'), 0)}
- Schools & Educational: {safe_int(counts.get('schools'), 0)}
- Restaurants & Dining: {safe_int(counts.get('restaurants'), 0)}
- Banks & ATMs: {safe_int(counts.get('banks'), 0)}
- Parks & Green Spaces: {safe_int(counts.get('parks'), 0)}
- Fuel & EV Stations: {safe_int(counts.get('fuel_stations'), 0)}
- Bus Stops & Public Transit: {safe_int(counts.get('bus_stops'), 0)}

COMPETITOR METRICS:
- Total Direct Competitors: {safe_int(comp_meta.get('competitor_count'), 0)}
- Market Competition Level: {comp_meta.get('competition_level', 'Low')}
- Competition Density: {competition_density:.2f} competitors / km²
- Distance to Nearest Competitor: {comp_meta.get('nearest_distance_m', 'N/A')} metres

FORMAT REQUIREMENT:
Return valid JSON matching this structure:
{{
  "executive_summary": "High level strategy overview",
  "location_overview": "Spatial setting and urban context",
  "readiness_interpretation": "Detailed breakdown of why the location scored {score:.1f}/100",
  "infrastructure_analysis": "In-depth analysis of roads, healthcare, education, dining, and transit",
  "accessibility_analysis": "Road quality, transit access, and traffic flow evaluation",
  "competitor_analysis": "Market saturation, threat level, and competitive moat",
  "nearby_amenities_summary": "Cluster summary of local conveniences",
  "swot": {{
    "strengths": ["s1", "s2", "s3"],
    "weaknesses": ["w1", "w2"],
    "opportunities": ["o1", "o2"],
    "threats": ["t1", "t2"]
  }},
  "risk_assessment": {{
    "business_risks": "Risk description",
    "accessibility_risks": "Risk description",
    "infrastructure_risks": "Risk description",
    "market_risks": "Risk description"
  }},
  "investment_recommendation": {{
    "grade": "A",
    "recommendation": "YES",
    "reasoning": "Detailed justification"
  }},
  "business_strategy": {{
    "target_customers": "Customer segments",
    "marketing_ideas": ["m1", "m2"],
    "best_operating_hours": "Operating hours recommendation",
    "expansion_opportunities": "Growth paths",
    "business_improvements": ["i1", "i2"]
  }},
  "future_potential": "3-5 year growth prognosis",
  "final_conclusion": "Executive closing statement"
}}
"""
        return prompt.strip()
