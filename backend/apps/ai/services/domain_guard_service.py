import logging
import re
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Keywords & concepts relevant to Obrix and location intelligence
RELEVANT_KEYWORDS = {
    # Core domain & brand
    "obrix", "gis", "geospatial", "site", "location", "score", "readiness",
    "catchment", "demographic", "footfall", "population", "traffic",
    
    # Business categories
    "pharmacy", "chemist", "drugstore", "medical", "medicine",
    "stationery", "school supply", "bookstore", "education",
    "cafe", "coffee", "restaurant", "dining", "eatery",
    "grocery", "supermarket", "store", "retail", "market",
    
    # Amenities & features
    "hospital", "clinic", "school", "college", "university",
    "bank", "atm", "park", "fuel", "gas", "bus", "transit", "station",
    "road", "highway", "access", "accessibility", "parking", "poi",
    
    # Competition & factors
    "competitor", "competition", "density", "distance", "nearby",
    "commercial", "residential", "infrastructure", "environment",
    "strength", "weakness", "risk", "opportunity", "swot",
    
    # Common site selection phrasing
    "site selection", "feasibility", "expansion", "area", "zone",
    "neighbourhood", "neighborhood", "city", "ahmedabad", "satellite", "vastrapur",
    "compare", "comparison", "recommend", "recommendation"
}

# Short conversational follow-up patterns
FOLLOW_UP_PATTERNS = [
    r"^\s*why\??\s*$",
    r"^\s*why\s+not\??\s*$",
    r"^\s*why\s+did\s+this\s+.*$",
    r"^\s*what\s+about\s+.*$",
    r"^\s*which\s+one\s+.*$",
    r"^\s*which\s+is\s+better\??\s*$",
    r"^\s*explain\s+that\.*$",
    r"^\s*tell\s+me\s+more\.*$",
    r"^\s*what\s+else\??\s*$",
    r"^\s*what\s+is\s+the\s+biggest\s+.*$",
    r"^\s*how\s+so\??\s*$",
    r"^\s*is\s+it\s+good\??\s*$",
    r"^\s*would\s+you\s+recommend\s+.*$",
]

# Obvious off-topic triggers
OFF_TOPIC_REGEXES = [
    r"\b(write|create|generate)\b.*\b(python|javascript|code|java|c\+\+|html|css|sql|script|function|class|bubble sort|algorithm)\b",
    r"\b(who|what|when)\b.*\b(world cup|prime minister|president|football|cricket|nba|nfl|soccer|movie|actor|oscar)\b",
    r"\b(write|draft)\b.*\b(essay|poem|song|story|homework|assignment|letter|resume)\b",
    r"\b(explain|what is)\b.*\b(quantum physics|relativity|black hole|photosynthesis|french revolution|world war)\b",
    r"\b(give|tell|make)\b.*\b(workout|diet|recipe|joke|riddle|horoscope)\b",
]

DEFAULT_REFUSAL_TEXT = (
    "I specialize in location intelligence and site analysis. I can help you evaluate locations, "
    "understand Obrix scores, compare sites, or discuss business-location factors."
)

class DomainGuardService:
    @classmethod
    def check_relevance(
        cls,
        message: str,
        history: List[Dict[str, Any]] = None,
        context_type: str = "general",
        analysis_context: Dict[str, Any] = None
    ) -> Tuple[bool, str]:
        """
        Determines whether a message is relevant to Obrix/Location Intelligence.
        Returns (is_relevant, response_or_refusal_text).
        """
        msg_clean = message.strip().lower()

        # 1. Check explicit off-topic regexes first
        for rx in OFF_TOPIC_REGEXES:
            if re.search(rx, msg_clean):
                logger.info(f"[DomainGuard] Blocked off-topic prompt matching pattern '{rx}': '{message[:40]}'")
                return False, DEFAULT_REFUSAL_TEXT

        # 2. Check if context or active analysis exists
        has_context = bool(analysis_context) or (context_type in ["single_analysis", "comparison"])
        has_history = bool(history and len(history) > 0)

        # 3. Check for domain keyword matches
        tokens = set(re.findall(r'\b\w+\b', msg_clean))
        if tokens.intersection(RELEVANT_KEYWORDS):
            return True, ""

        # 4. Check follow-up patterns if history or analysis context exists
        if has_context or has_history:
            for pattern in FOLLOW_UP_PATTERNS:
                if re.search(pattern, msg_clean):
                    return True, ""
            if has_history:
                return True, ""

        # 5. If no domain keywords and no ongoing conversation context, reject
        logger.info(f"[DomainGuard] Rejected message lacking domain keywords: '{message[:40]}'")
        return False, DEFAULT_REFUSAL_TEXT

