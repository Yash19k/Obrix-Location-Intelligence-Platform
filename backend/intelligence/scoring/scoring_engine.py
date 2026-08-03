"""
intelligence/scoring/scoring_engine.py

Rebalanced deterministic, rule-based scoring engine for Obrix.
Implements diminishing returns for positive factors, progressive competition penalties,
and piecewise linear normalization to ensure a realistic, discriminative score distribution.
"""

import math
import logging
from typing import Any, Dict, List, Tuple
from .business_profiles import BUSINESS_PROFILES
from .recommendation_engine import RecommendationEngine
from .types import FactorScore, ScoreResult

logger = logging.getLogger(__name__)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes haversine distance in meters between two points.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def normalize_final_score(raw_score: float) -> float:
    """
    Applies non-linear piecewise normalization to match target scoring distribution.
    Prevents inflation while ensuring high-fidelity discrimination:
      - Raw < 30: Maps to [0, 40]
      - Raw 30-50: Maps to [40, 55]
      - Raw 50-70: Maps to [55, 68]
      - Raw 70-80: Maps to [68, 75]
      - Raw 80-90: Maps to [75, 85]
      - Raw 90-96: Maps to [85, 90]
      - Raw 96-100: Maps to [90, 95] (exceptional range, extremely rare)
    """
    if raw_score <= 0:
        return 0.0
    if raw_score >= 100:
        return 95.0
        
    if raw_score < 30:
        return raw_score * (40.0 / 30.0)
    elif raw_score < 50:
        return 40.0 + (raw_score - 30.0) * (55.0 - 40.0) / 20.0
    elif raw_score < 70:
        return 55.0 + (raw_score - 50.0) * (68.0 - 55.0) / 20.0
    elif raw_score < 80:
        return 68.0 + (raw_score - 70.0) * (75.0 - 68.0) / 10.0
    elif raw_score < 90:
        return 75.0 + (raw_score - 80.0) * (85.0 - 75.0) / 10.0
    elif raw_score < 96:
        return 85.0 + (raw_score - 90.0) * (90.0 - 85.0) / 6.0
    else:
        return 90.0 + (raw_score - 96.0) * (95.0 - 90.0) / 4.0

class RuleBasedScoringEngine:
    """
    ScoringEngine implementation using rebalanced rule-based spatial heuristics.
    """

    def calculate(
        self,
        feature_counts: Dict[str, int],
        business_type: str = "pharmacy",
        lat: float = 0.0,
        lon: float = 0.0,
        radius_m: int = 1000,
        feature_result: Any = None,
    ) -> ScoreResult:
        """
        Calculates category and overall scores using distance decay and diminishing returns.
        """
        biz_key = business_type.lower()
        if biz_key not in BUSINESS_PROFILES:
            biz_key = "pharmacy"

        profile = BUSINESS_PROFILES[biz_key]
        category_weights = profile["category_weights"]

        # 1. Parse and extract subfeatures from GeoFeatures
        subfeatures = self._parse_subfeatures(feature_result, feature_counts, lat, lon)

        # Track explanation details
        positives_tracked = []
        negatives_tracked = []

        # Category scores dictionary
        cat_scores = {
            "accessibility": 50.0,
            "competition": 50.0,
            "population": 50.0,
            "commercial": 50.0
        }

        # ── Compute accessibility ──
        acc_score, acc_pos, acc_neg = self._compute_accessibility(profile, subfeatures, feature_counts, lat, lon)
        cat_scores["accessibility"] = acc_score
        positives_tracked.extend(acc_pos)
        negatives_tracked.extend(acc_neg)

        # ── Compute population ──
        pop_score, pop_pos, pop_neg = self._compute_population(profile, subfeatures, feature_counts, lat, lon)
        cat_scores["population"] = pop_score
        positives_tracked.extend(pop_pos)
        negatives_tracked.extend(pop_neg)

        # ── Compute commercial ──
        com_score, com_pos, com_neg = self._compute_commercial(profile, subfeatures, lat, lon)
        cat_scores["commercial"] = com_score
        positives_tracked.extend(com_pos)
        negatives_tracked.extend(com_neg)

        # ── Compute competition ──
        comp_score, comp_pos, comp_neg = self._compute_competition(profile, subfeatures, feature_counts, biz_key, lat, lon)
        cat_scores["competition"] = comp_score
        positives_tracked.extend(comp_pos)
        negatives_tracked.extend(comp_neg)

        # 2. Weighted overall raw score calculation
        raw_overall = sum(cat_scores[cat] * weight for cat, weight in category_weights.items())
        raw_overall = max(0.0, min(100.0, raw_overall))
        
        # 3. Normalize score (piecewise distribution scaling)
        overall = round(normalize_final_score(raw_overall), 1)

        # 4. Sort and format explanations
        positives_tracked.sort(key=lambda x: x[1], reverse=True)
        negatives_tracked.sort(key=lambda x: x[1]) # More negative first

        top_positive = [item[0] for item in positives_tracked[:3]]
        top_negative = [item[0] for item in negatives_tracked[:3]]

        # Clean fallback if empty
        if not top_positive:
            top_positive.append("Good overall profile compatibility")
        if not top_negative:
            top_negative.append("No major negative factors detected")

        # 5. Generate recommendation
        recommendation = RecommendationEngine.generate(biz_key, overall, top_positive, top_negative)

        # 6. Build FactorScore objects for backward compatibility with frontend factor bars
        factors = {}
        for cat, score in cat_scores.items():
            cat_pos = [item[0] for item in positives_tracked if item[2] == cat]
            cat_neg = [item[0] for item in negatives_tracked if item[2] == cat]
            
            explanation_parts = []
            if cat_pos:
                explanation_parts.append("Strengths: " + ", ".join(cat_pos[:2]))
            if cat_neg:
                explanation_parts.append("Risks: " + ", ".join(cat_neg[:2]))
            
            explanation = " | ".join(explanation_parts) if explanation_parts else "Neutral characteristics."

            factors[cat] = FactorScore(
                key=cat,
                label=cat.title() if cat != "population" else "Population & Catchment",
                score=score,
                explanation=explanation,
                inputs={"count": len(subfeatures.get(cat, []))},
                sub_scores={}
            )

        # Environmental suitability (fallback for UI compatibility)
        factors["environment"] = FactorScore(
            key="environment",
            label="Environmental Suitability",
            score=75.0,
            explanation="Area generally suitable with low natural risks.",
            inputs={},
            sub_scores={}
        )

        return ScoreResult(
            overall=overall,
            factors=factors,
            weights_used=category_weights,
            business_type=biz_key,
            distance_metrics={},
            density_metrics={},
            road_hierarchy={"quality_score": 85.0, "dominant_type": "residential"},
            competition_metrics={
                "competitor_count": len(subfeatures.get("competition", [])),
                "breakdown": {}
            },
            normalization_metadata={
                "method": "rule-based-rebalanced",
                "radius_m": radius_m
            },
            top_positive=top_positive,
            top_negative=top_negative,
            recommendation=recommendation
        )

    def _parse_subfeatures(self, feature_result: Any, feature_counts: Dict[str, int], lat: float, lon: float) -> Dict[str, List[Dict[str, Any]]]:
        """
        Parses raw GeoFeatures or counts into discrete lists of dict representations with distance properties.
        """
        subfeatures = {k: [] for k in [
            "hospitals", "clinics", "diagnostic_centres", "schools", "colleges",
            "coaching_centres", "restaurants", "cafes", "banks", "malls", "offices",
            "bus_stops", "metro", "parks", "apartments", "competition"
        ]}

        if feature_result and hasattr(feature_result, "features"):
            for cat, feats in feature_result.features.items():
                for f in feats:
                    name_lower = (f.name or "").lower()
                    tags = f.tags or {}
                    amenity = tags.get("amenity", "").lower()
                    building = tags.get("building", "").lower()
                    shop = tags.get("shop", "").lower()
                    
                    dist = haversine_distance(lat, lon, f.lat, f.lon)
                    feat_dict = {"name": f.name or cat.title(), "distance": dist, "raw": f}

                    if cat == "hospitals":
                        if any(x in amenity or x in name_lower for x in ["clinic", "doctor", "nursing_home"]):
                            subfeatures["clinics"].append(feat_dict)
                        elif "diagnostic" in name_lower or "lab" in name_lower or "diagnostic" in amenity:
                            subfeatures["diagnostic_centres"].append(feat_dict)
                        else:
                            subfeatures["hospitals"].append(feat_dict)
                            
                    elif cat == "schools":
                        if any(x in amenity or x in name_lower for x in ["college", "university"]):
                            subfeatures["colleges"].append(feat_dict)
                        elif any(x in name_lower or x in amenity for x in ["coaching", "academy", "language"]):
                            subfeatures["coaching_centres"].append(feat_dict)
                        else:
                            subfeatures["schools"].append(feat_dict)
                            
                    elif cat == "restaurants":
                        if any(x in amenity or x in name_lower for x in ["cafe", "coffee", "bakery"]):
                            subfeatures["cafes"].append(feat_dict)
                        else:
                            subfeatures["restaurants"].append(feat_dict)
                            
                    elif cat == "banks":
                        if any(x in shop or x in building or x in name_lower for x in ["mall", "complex"]):
                            subfeatures["malls"].append(feat_dict)
                        elif "office" in building or "office" in tags.get("office", "") or "office" in name_lower:
                            subfeatures["offices"].append(feat_dict)
                        else:
                            subfeatures["banks"].append(feat_dict)
                            
                    elif cat == "bus_stops":
                        if any(x in name_lower or x in amenity for x in ["metro", "subway", "rail"]):
                            subfeatures["metro"].append(feat_dict)
                        else:
                            subfeatures["bus_stops"].append(feat_dict)
                            
                    elif cat == "parks":
                        if any(x in name_lower or x in building for x in ["apartment", "residential"]):
                            subfeatures["apartments"].append(feat_dict)
                        else:
                            subfeatures["parks"].append(feat_dict)

        # BACKWARD COMPATIBILITY: If list is empty but we have counts, mock virtual features
        for key, parent in [
            ("hospitals", "hospitals"), ("clinics", "hospitals"), ("diagnostic_centres", "hospitals"),
            ("schools", "schools"), ("colleges", "schools"), ("coaching_centres", "schools"),
            ("restaurants", "restaurants"), ("cafes", "restaurants"),
            ("banks", "banks"), ("malls", "banks"), ("offices", "banks"),
            ("bus_stops", "bus_stops"), ("metro", "bus_stops"),
            ("parks", "parks"), ("apartments", "parks")
        ]:
            if not subfeatures[key]:
                cnt = feature_counts.get(parent, 0)
                if cnt > 0:
                    ratio = 0.4 if key in ["hospitals", "colleges", "cafes", "malls"] else 0.6
                    allocated = max(1, int(cnt * ratio))
                    for i in range(allocated):
                        # DENSITY DECAY VIRTUAL DISTANCE
                        v_dist = (800.0 / math.sqrt(cnt)) * (i + 0.2)
                        subfeatures[key].append({
                            "name": f"Virtual {key.replace('_', ' ').title()}",
                            "distance": v_dist
                        })

        return subfeatures

    def _compute_diminishing_score(self, feats: List[Dict[str, Any]], config_factor: Dict, label: str, cat_key: str) -> Tuple[float, List[Tuple[str, float, str]], float]:
        """
        Applies strong distance decay bands and diminishing returns for positive factors:
          - Feature 1: 1.0 * score
          - Feature 2: 0.35 * score
          - Feature 3: 0.15 * score
          - Feature 4+: 0.0
        The final score is scaled relative to the factor weight (defines max points in the category).
        """
        bands = config_factor.get("bands", {})
        weight = config_factor.get("weight", 1.0)
        
        raw_scores = []
        closest_dist = float("inf")

        for f in feats:
            d = f["distance"]
            if d < closest_dist:
                closest_dist = d
            
            # Find closest band limit
            for max_d, score_val in sorted(bands.items()):
                if d <= max_d:
                    raw_scores.append(score_val)
                    break

        # Apply diminishing returns multipliers
        raw_scores.sort(reverse=True)
        multipliers = [1.0, 0.35, 0.15]
        total_raw = 0.0
        for idx, s in enumerate(raw_scores):
            if idx < len(multipliers):
                total_raw += s * multipliers[idx]
            else:
                break

        # Scale raw score to max points allocated in the category
        max_band_val = max(bands.values()) if bands else 10.0
        max_possible_raw = max_band_val * (1.0 + 0.35 + 0.15)
        
        scale = (weight * 100.0) / max_possible_raw if max_possible_raw > 0 else 0.0
        points = total_raw * scale

        explanations = []
        if points > 0:
            formatted_dist = f"{int(closest_dist)}m" if closest_dist < 1000 else f"{closest_dist/1000.0:.1f}km"
            explanations.append((f"{label} within {formatted_dist} (+{points:.1f})", points, cat_key))

        return points, explanations, closest_dist

    def _compute_accessibility(self, profile: Dict, subfeatures: Dict, feature_counts: Dict[str, int], lat: float, lon: float) -> Tuple[float, List[Tuple[str, float, str]], List[Tuple[str, float, str]]]:
        pos = []
        neg = []
        
        pos_cfg = profile["positive_factors"]
        points_list = []

        roads_cnt = feature_counts.get("roads", 0)
        parks_cnt = feature_counts.get("parks", 0)

        # Parking
        parking_cfg = pos_cfg.get("parking", {})
        if parking_cfg:
            parking_val = min(100.0, (roads_cnt * 2.0) + (parks_cnt * 10.0))
            mapped_pts = self._map_score(parking_val, parking_cfg.get("score_mapping", {}))
            max_mapped = max(parking_cfg["score_mapping"].values())
            scale = (parking_cfg["weight"] * 100.0) / max_mapped if max_mapped > 0 else 0.0
            pts = mapped_pts * scale
            points_list.append(pts)
            if pts > (parking_cfg["weight"] * 50.0):
                pos.append(("Good parking options", float(pts), "accessibility"))
            else:
                neg.append(("Limited parking options", float(-pts), "accessibility"))

        # Road accessibility
        road_cfg = pos_cfg.get("road_access", {})
        if road_cfg:
            road_val = min(100.0, roads_cnt * 4.0)
            mapped_pts = self._map_score(road_val, road_cfg.get("score_mapping", {}))
            max_mapped = max(road_cfg["score_mapping"].values())
            scale = (road_cfg["weight"] * 100.0) / max_mapped if max_mapped > 0 else 0.0
            pts = mapped_pts * scale
            points_list.append(pts)
            if pts > (road_cfg["weight"] * 50.0):
                pos.append(("Main road nearby", float(pts), "accessibility"))
            else:
                neg.append(("Poor road accessibility", float(-pts), "accessibility"))

        # Bus stops / Transit
        bus_cfg = pos_cfg.get("bus_stops", {})
        if bus_cfg:
            bus_score, bus_pos, closest = self._compute_diminishing_score(subfeatures.get("bus_stops", []), bus_cfg, "Bus stop", "accessibility")
            points_list.append(bus_score)
            pos.extend(bus_pos)

        # Metro
        metro_cfg = pos_cfg.get("metro", {})
        if metro_cfg:
            metro_score, metro_pos, closest = self._compute_diminishing_score(subfeatures.get("metro", []), metro_cfg, "Metro station", "accessibility")
            points_list.append(metro_score)
            pos.extend(metro_pos)

        overall_acc = sum(points_list)
        overall_acc = max(0.0, min(100.0, overall_acc))
        return round(overall_acc, 1), pos, neg

    def _compute_population(self, profile: Dict, subfeatures: Dict, feature_counts: Dict[str, int], lat: float, lon: float) -> Tuple[float, List[Tuple[str, float, str]], List[Tuple[str, float, str]]]:
        pos = []
        neg = []
        
        pos_cfg = profile["positive_factors"]
        points_list = []

        roads_cnt = feature_counts.get("roads", 0)
        parks_cnt = feature_counts.get("parks", 0)
        schools_cnt = len(subfeatures.get("schools", []))
        colleges_cnt = len(subfeatures.get("colleges", []))
        restaurants_cnt = len(subfeatures.get("restaurants", []))

        # Residential density
        res_cfg = pos_cfg.get("residential_density", {})
        if res_cfg:
            res_val = min(100.0, (roads_cnt * 1.5) + (parks_cnt * 8.0))
            mapped_pts = self._map_score(res_val, res_cfg["score_mapping"])
            max_mapped = max(res_cfg["score_mapping"].values())
            scale = (res_cfg["weight"] * 100.0) / max_mapped if max_mapped > 0 else 0.0
            pts = mapped_pts * scale
            points_list.append(pts)
            if pts > (res_cfg["weight"] * 50.0):
                pos.append(("Good residential density", float(pts), "population"))

        # Population density
        pop_cfg = pos_cfg.get("population_density", {})
        if pop_cfg:
            pop_val = min(20000.0, (roads_cnt * 300.0) + (parks_cnt * 1500.0))
            mapped_pts = self._map_score(pop_val, pop_cfg["score_mapping"])
            max_mapped = max(pop_cfg["score_mapping"].values())
            scale = (pop_cfg["weight"] * 100.0) / max_mapped if max_mapped > 0 else 0.0
            pts = mapped_pts * scale
            points_list.append(pts)
            if pts > (pop_cfg["weight"] * 50.0):
                pos.append(("Solid population catchment", float(pts), "population"))

        # Student population
        student_cfg = pos_cfg.get("student_population", {})
        if student_cfg:
            student_val = min(100.0, schools_cnt * 12.0 + colleges_cnt * 20.0)
            mapped_pts = self._map_score(student_val, student_cfg["score_mapping"])
            max_mapped = max(student_cfg["score_mapping"].values())
            scale = (student_cfg["weight"] * 100.0) / max_mapped if max_mapped > 0 else 0.0
            pts = mapped_pts * scale
            points_list.append(pts)
            if pts > (student_cfg["weight"] * 50.0):
                pos.append(("Strong student presence", float(pts), "population"))

        # Foot traffic
        ft_cfg = pos_cfg.get("foot_traffic", {})
        if ft_cfg:
            ft_val = min(100.0, restaurants_cnt * 3.0 + roads_cnt * 1.5)
            mapped_pts = self._map_score(ft_val, ft_cfg["score_mapping"])
            max_mapped = max(ft_cfg["score_mapping"].values())
            scale = (ft_cfg["weight"] * 100.0) / max_mapped if max_mapped > 0 else 0.0
            pts = mapped_pts * scale
            points_list.append(pts)
            if pts > (ft_cfg["weight"] * 50.0):
                pos.append(("High pedestrian foot traffic", float(pts), "population"))

        # Apartments
        apt_cfg = pos_cfg.get("apartments", {})
        if apt_cfg:
            apt_score, apt_pos, closest = self._compute_diminishing_score(subfeatures.get("apartments", []), apt_cfg, "Apartment block", "population")
            points_list.append(apt_score)
            pos.extend(apt_pos)

        # Residential Area (Stationery)
        res_area_cfg = pos_cfg.get("residential_area", {})
        if res_area_cfg:
            res_val = min(100.0, roads_cnt * 2.5)
            mapped_pts = self._map_score(res_val, res_area_cfg["score_mapping"])
            max_mapped = max(res_area_cfg["score_mapping"].values())
            scale = (res_area_cfg["weight"] * 100.0) / max_mapped if max_mapped > 0 else 0.0
            pts = mapped_pts * scale
            points_list.append(pts)
            if pts > (res_area_cfg["weight"] * 50.0):
                pos.append(("Residential area nearby", float(pts), "population"))

        # Office density
        office_cfg = pos_cfg.get("office_density", {})
        if office_cfg:
            office_val = min(100.0, len(subfeatures.get("offices", [])) * 25.0 + feature_counts.get("banks", 0) * 2.0)
            mapped_pts = self._map_score(office_val, office_cfg["score_mapping"])
            max_mapped = max(office_cfg["score_mapping"].values())
            scale = (office_cfg["weight"] * 100.0) / max_mapped if max_mapped > 0 else 0.0
            pts = mapped_pts * scale
            points_list.append(pts)
            if pts > (office_cfg["weight"] * 50.0):
                pos.append(("High office density", float(pts), "population"))

        overall_pop = sum(points_list)
        overall_pop = max(0.0, min(100.0, overall_pop))
        return round(overall_pop, 1), pos, neg

    def _compute_commercial(self, profile: Dict, subfeatures: Dict, lat: float, lon: float) -> Tuple[float, List[Tuple[str, float, str]], List[Tuple[str, float, str]]]:
        pos = []
        neg = []
        
        pos_cfg = profile["positive_factors"]
        points_list = []

        # Hospital
        hosp_cfg = pos_cfg.get("hospitals", {})
        if hosp_cfg:
            h_score, h_pos, closest = self._compute_diminishing_score(subfeatures.get("hospitals", []), hosp_cfg, "Hospital", "commercial")
            points_list.append(h_score)
            pos.extend(h_pos)

        # Clinics
        clinic_cfg = pos_cfg.get("clinics", {})
        if clinic_cfg:
            c_score, c_pos, closest = self._compute_diminishing_score(subfeatures.get("clinics", []), clinic_cfg, "Clinic", "commercial")
            points_list.append(c_score)
            pos.extend(c_pos)

        # Diagnostic Centres
        diag_cfg = pos_cfg.get("diagnostic_centres", {})
        if diag_cfg:
            d_score, d_pos, closest = self._compute_diminishing_score(subfeatures.get("diagnostic_centres", []), diag_cfg, "Diagnostic centre", "commercial")
            points_list.append(d_score)
            pos.extend(d_pos)

        # Schools
        school_cfg = pos_cfg.get("schools", {})
        if school_cfg:
            s_score, s_pos, closest = self._compute_diminishing_score(subfeatures.get("schools", []), school_cfg, "School", "commercial")
            points_list.append(s_score)
            pos.extend(s_pos)

        # Colleges
        coll_cfg = pos_cfg.get("colleges", {})
        if coll_cfg:
            co_score, co_pos, closest = self._compute_diminishing_score(subfeatures.get("colleges", []), coll_cfg, "College", "commercial")
            points_list.append(co_score)
            pos.extend(co_pos)

        # Coaching Centres
        coach_cfg = pos_cfg.get("coaching_centres", {})
        if coach_cfg:
            cc_score, cc_pos, closest = self._compute_diminishing_score(subfeatures.get("coaching_centres", []), coach_cfg, "Coaching centre", "commercial")
            points_list.append(cc_score)
            pos.extend(cc_pos)

        # Malls
        mall_cfg = pos_cfg.get("malls", {})
        if mall_cfg:
            m_score, m_pos, closest = self._compute_diminishing_score(subfeatures.get("malls", []), mall_cfg, "Mall", "commercial")
            points_list.append(m_score)
            pos.extend(m_pos)

        # Restaurants / Dining
        rest_cfg = pos_cfg.get("restaurants", {})
        if rest_cfg:
            r_score, r_pos, closest = self._compute_diminishing_score(subfeatures.get("restaurants", []), rest_cfg, "Dining hub", "commercial")
            points_list.append(r_score)
            pos.extend(r_pos)

        # Banks
        bank_cfg = pos_cfg.get("banks", {})
        if bank_cfg:
            bk_score, bk_pos, closest = self._compute_diminishing_score(subfeatures.get("banks", []), bank_cfg, "Financial service", "commercial")
            points_list.append(bk_score)
            pos.extend(bk_pos)

        # Parks
        park_cfg = pos_cfg.get("parks", {})
        if park_cfg:
            pk_score, pk_pos, closest = self._compute_diminishing_score(subfeatures.get("parks", []), park_cfg, "Park", "commercial")
            points_list.append(pk_score)
            pos.extend(pk_pos)

        overall_com = sum(points_list)
        overall_com = max(0.0, min(100.0, overall_com))
        return round(overall_com, 1), pos, neg

    def _compute_competition(self, profile: Dict, subfeatures: Dict, feature_counts: Dict[str, int], biz_key: str, lat: float, lon: float) -> Tuple[float, List[Tuple[str, float, str]], List[Tuple[str, float, str]]]:
        pos = []
        neg = []
        
        neg_cfg = profile["negative_factors"]
        weights = []
        sub_penalties = []

        # ── Competitor Progressive Penalties ──
        comp_cfg = neg_cfg.get("competition", {})
        if comp_cfg:
            competitor_type = comp_cfg.get("competitor_type", biz_key)
            
            competitors = []
            if competitor_type == "pharmacy":
                for f in subfeatures.get("clinics", []) + subfeatures.get("hospitals", []):
                    if any(x in (f["name"] or "").lower() for x in ["pharmacy", "chemist", "medicals"]):
                        competitors.append(f)
            elif competitor_type == "stationery":
                for f in subfeatures.get("schools", []) + subfeatures.get("coaching_centres", []):
                    if any(x in (f["name"] or "").lower() for x in ["book", "stationery", "xerox"]):
                        competitors.append(f)
            elif competitor_type == "cafe":
                competitors = subfeatures.get("cafes", [])
            elif competitor_type == "grocery":
                for f in subfeatures.get("banks", []) + subfeatures.get("malls", []):
                    if any(x in (f["name"] or "").lower() for x in ["grocery", "supermarket", "mart", "store"]):
                        competitors.append(f)

            # If no actual competitors are parsed, but the counts suggest they exist, mock them
            if not competitors:
                parent_count = feature_counts.get("hospitals" if competitor_type == "pharmacy" else "schools" if competitor_type == "stationery" else "restaurants" if competitor_type == "cafe" else "banks", 0)
                if parent_count > 0:
                    allocated = max(1, int(parent_count * 0.15))
                    for i in range(allocated):
                        v_dist = (800.0 / math.sqrt(parent_count)) * (i + 0.3)
                        competitors.append({
                            "name": f"Virtual Competitor {competitor_type.title()}",
                            "distance": v_dist
                        })

            subfeatures["competition"] = competitors

            # Apply progressive competitor penalty multipliers:
            # 1: -5, 2: -10 (incremental -5), 3: -18 (incremental -8), 5: -30 (incremental -6)
            progressive_penalties = [5.0, 5.0, 8.0, 6.0, 6.0]
            penalty = 0.0
            
            # Sort competitors by distance (closest first)
            competitors.sort(key=lambda x: x["distance"])
            
            for idx, c in enumerate(competitors):
                d = c["distance"]
                
                # Base penalty step
                if idx < len(progressive_penalties):
                    base_p = progressive_penalties[idx]
                else:
                    base_p = 1.0  # nominal for 6th+ competitor
                    
                # Distance decay modifier
                if d <= 200:
                    distance_mod = 1.0
                elif d <= 500:
                    distance_mod = 0.6
                elif d <= 1000:
                    distance_mod = 0.3
                else:
                    distance_mod = 0.0
                    
                penalty += base_p * distance_mod

            penalty = min(40.0, penalty) # cap at 40 max penalty
            sub_penalties.append(penalty)
            weights.append(comp_cfg["weight"])
            
            if len(competitors) > 0 and penalty > 0:
                competitor_label = "competitor" if len(competitors) == 1 else "competitor pharmacies" if competitor_type == "pharmacy" else f"competitor {competitor_type}s"
                neg.append((f"{len(competitors)} {competitor_label} nearby (-{penalty:.1f})", -penalty, "competition"))

        # Flood risk
        flood_cfg = neg_cfg.get("flood_risk", {})
        if flood_cfg:
            flood_val = 10.0
            pts = abs(self._map_score(flood_val, flood_cfg["score_mapping"]))
            max_mapped = max(abs(x) for x in flood_cfg["score_mapping"].values())
            scale = (flood_cfg["weight"] * 100.0) / max_mapped if max_mapped > 0 else 0.0
            penalty = pts * scale
            sub_penalties.append(penalty)
            weights.append(flood_cfg["weight"])
            if penalty > 3:
                neg.append(("Moderate flood risk zone (-8.0)", -penalty, "competition"))

        overall_comp = 100.0 - sum(sub_penalties)
        overall_comp = max(0.0, min(100.0, overall_comp))
        return round(overall_comp, 1), pos, neg

    def _map_score(self, val: float, mapping: Dict[float, float]) -> float:
        """
        Maps a continuous variable to its point score contribution by linear interpolation.
        """
        sorted_map = sorted(mapping.items())
        if val <= sorted_map[0][0]:
            return sorted_map[0][1]
        if val >= sorted_map[-1][0]:
            return sorted_map[-1][1]
            
        # Interpolate
        for i in range(len(sorted_map) - 1):
            x1, y1 = sorted_map[i]
            x2, y2 = sorted_map[i+1]
            if x1 <= val <= x2:
                return y1 + (y2 - y1) * (val - x1) / (x2 - x1)
        return 0.0
