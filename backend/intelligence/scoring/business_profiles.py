"""
intelligence/scoring/business_profiles.py

Rebalanced configuration for rule-based business-specific location suitability scoring.
Implements strong distance decay bands, diminishing returns, and increased competition penalties.
"""

BUSINESS_PROFILES = {
    "pharmacy": {
        "name": "Pharmacy / Medical Store",
        "category_weights": {
            "accessibility": 0.20,
            "competition": 0.25,
            "population": 0.35,
            "commercial": 0.20
        },
        "positive_factors": {
            # Category: population
            "residential_density": {"weight": 0.50, "category": "population", "score_mapping": {80: 20, 50: 12, 20: 5}},
            "population_density": {"weight": 0.50, "category": "population", "score_mapping": {15000: 20, 8000: 12, 2000: 5}},
            
            # Category: commercial
            "hospitals": {"weight": 0.40, "category": "commercial", "bands": {150: 18, 300: 12, 600: 6, 1000: 2}},
            "clinics": {"weight": 0.30, "category": "commercial", "bands": {150: 15, 300: 10, 600: 5, 1000: 2}},
            "diagnostic_centres": {"weight": 0.20, "category": "commercial", "bands": {150: 12, 300: 8, 600: 4, 1000: 1}},
            
            # Minor influence (schools contribute very little)
            "schools": {"weight": 0.10, "category": "commercial", "bands": {150: 2, 300: 1, 600: 0.5}},

            # Category: accessibility
            "parking": {"weight": 0.50, "category": "accessibility", "score_mapping": {80: 10, 50: 5, 20: 2}},
            "road_access": {"weight": 0.50, "category": "accessibility", "score_mapping": {70: 10, 40: 5, 15: 2}},
        },
        "negative_factors": {
            # Category: competition
            "competition": {"weight": 0.75, "category": "competition", "competitor_type": "pharmacy"},
            "flood_risk": {"weight": 0.25, "category": "competition", "score_mapping": {80: -15, 50: -8, 20: -3}}
        },
        "recommendation_template": "Excellent healthcare ecosystem with strong long-term demand."
    },
    "stationery": {
        "name": "Stationery / Book Store",
        "category_weights": {
            "accessibility": 0.20,
            "competition": 0.30,
            "population": 0.35,
            "commercial": 0.15
        },
        "positive_factors": {
            # Category: population
            "student_population": {"weight": 0.50, "category": "population", "score_mapping": {80: 20, 50: 12, 20: 5}},
            "residential_area": {"weight": 0.50, "category": "population", "score_mapping": {70: 15, 40: 8, 15: 3}},

            # Category: commercial
            "schools": {"weight": 0.45, "category": "commercial", "bands": {150: 18, 300: 12, 600: 6, 1000: 2}},
            "colleges": {"weight": 0.35, "category": "commercial", "bands": {150: 16, 300: 11, 600: 5, 1000: 2}},
            "coaching_centres": {"weight": 0.15, "category": "commercial", "bands": {150: 14, 300: 9, 600: 4, 1000: 1}},
            
            # Minor influence (hospitals have very little influence)
            "hospitals": {"weight": 0.05, "category": "commercial", "bands": {150: 2, 300: 1}},

            # Category: accessibility
            "parking": {"weight": 0.40, "category": "accessibility", "score_mapping": {80: 10, 50: 5, 20: 2}},
            "road_access": {"weight": 0.60, "category": "accessibility", "score_mapping": {70: 10, 40: 5, 15: 2}},
        },
        "negative_factors": {
            # Category: competition
            "competition": {"weight": 1.0, "category": "competition", "competitor_type": "stationery"}
        },
        "recommendation_template": "Excellent student catchment due to nearby schools and coaching centres."
    },
    "cafe": {
        "name": "Cafe / Restaurant",
        "category_weights": {
            "accessibility": 0.25,
            "competition": 0.25,
            "population": 0.20,
            "commercial": 0.30
        },
        "positive_factors": {
            # Category: population
            "foot_traffic": {"weight": 0.60, "category": "population", "score_mapping": {80: 20, 50: 12, 20: 5}},
            "office_density": {"weight": 0.40, "category": "population", "score_mapping": {80: 25, 50: 15, 20: 5}},

            # Category: commercial
            "colleges": {"weight": 0.40, "category": "commercial", "bands": {150: 18, 300: 12, 600: 6, 1000: 2}},
            "malls": {"weight": 0.30, "category": "commercial", "bands": {150: 18, 300: 12, 600: 6, 1000: 2}},
            "restaurants": {"weight": 0.25, "category": "commercial", "bands": {150: 12, 300: 8, 600: 4, 1000: 1}},
            
            # Minor influence (hospitals have very little influence)
            "hospitals": {"weight": 0.05, "category": "commercial", "bands": {150: 2, 300: 1}},

            # Category: accessibility
            "metro": {"weight": 0.30, "category": "accessibility", "bands": {150: 18, 300: 12, 600: 6, 1000: 2}},
            "bus_stops": {"weight": 0.30, "category": "accessibility", "bands": {150: 12, 300: 8, 600: 4, 1000: 1}},
            "parking": {"weight": 0.40, "category": "accessibility", "score_mapping": {80: 10, 50: 5, 20: 2}},
        },
        "negative_factors": {
            # Category: competition
            "competition": {"weight": 1.0, "category": "competition", "competitor_type": "cafe"}
        },
        "recommendation_template": "Strong office and college footfall makes this location ideal for a cafe."
    },
    "grocery": {
        "name": "Grocery / Supermarket",
        "category_weights": {
            "accessibility": 0.25,
            "competition": 0.25,
            "population": 0.35,
            "commercial": 0.15
        },
        "positive_factors": {
            # Category: population
            "residential_density": {"weight": 0.40, "category": "population", "score_mapping": {80: 25, 50: 15, 20: 5}},
            "population_density": {"weight": 0.40, "category": "population", "score_mapping": {15000: 25, 8000: 15, 2000: 5}},
            "apartments": {"weight": 0.20, "category": "population", "bands": {150: 18, 300: 12, 600: 6, 1000: 2}},

            # Category: commercial (local demand generators)
            "banks": {"weight": 0.50, "category": "commercial", "bands": {150: 15, 300: 10, 600: 5, 1000: 1}},
            "parks": {"weight": 0.40, "category": "commercial", "bands": {150: 15, 300: 8, 600: 4, 1000: 1}},
            
            # Minor influence
            "colleges": {"weight": 0.05, "category": "commercial", "bands": {150: 2, 300: 1}},
            "hospitals": {"weight": 0.05, "category": "commercial", "bands": {150: 2, 300: 1}},

            # Category: accessibility
            "parking": {"weight": 0.40, "category": "accessibility", "score_mapping": {80: 15, 50: 8, 20: 3}},
            "road_access": {"weight": 0.60, "category": "accessibility", "score_mapping": {70: 10, 40: 5, 15: 2}},
        },
        "negative_factors": {
            # Category: competition
            "competition": {"weight": 1.0, "category": "competition", "competitor_type": "grocery"}
        },
        "recommendation_template": "High surrounding residential population creates consistent daily demand."
    }
}
