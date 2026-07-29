"""
tests/scoring/test_phase3_final.py

Phase 3 Final unit tests:
  - normalization (log, sigmoid, distance_decay)
  - distance service (HaversineDistanceService)
  - density service (DensityService)
  - road service (RoadService)
  - competition service (CompetitionService)
  - confidence (ConfidenceCalculator)
  - explainability (ExplainabilityBuilder)
  - engine enrichment (with mock GeoFeature objects)
  - deterministic scoring
"""

import math
import unittest
from unittest.mock import MagicMock

from intelligence.scoring.normalization import (
    log_normalize, sigmoid_normalize, distance_decay, clamp,
)
from intelligence.scoring.services.distance   import HaversineDistanceService
from intelligence.scoring.services.density    import DensityService
from intelligence.scoring.services.roads      import RoadService, ROAD_QUALITY_WEIGHTS
from intelligence.scoring.services.competition import CompetitionService, COMPETITOR_PROFILES
from intelligence.scoring.confidence  import ConfidenceCalculator
from intelligence.scoring.explainability import ExplainabilityBuilder
from intelligence.scoring.engine       import ScoringEngine


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_feature(lat=None, lon=None, tags=None, name=None, cat="roads"):
    """Create a minimal GeoFeature-like mock."""
    f = MagicMock()
    f.lat  = lat
    f.lon  = lon
    f.tags = tags or {}
    f.name = name
    f.category = cat
    return f


# ── Normalization ─────────────────────────────────────────────────────────────

class TestLogNormalize(unittest.TestCase):

    def test_zero_returns_zero(self):
        self.assertEqual(log_normalize(0, 100), 0.0)

    def test_at_saturation_returns_100(self):
        self.assertAlmostEqual(log_normalize(100, 100), 100.0, places=5)

    def test_above_saturation_clamped_to_100(self):
        self.assertAlmostEqual(log_normalize(200, 100), 100.0, places=5)

    def test_half_saturation_above_50(self):
        """Diminishing returns: half-saturation gives > 50%."""
        score = log_normalize(50, 100)
        self.assertGreater(score, 50.0)
        self.assertLess(score, 100.0)

    def test_one_of_ten_gives_reasonable_score(self):
        """1 hospital (sat=10) should give a meaningful score, not near zero."""
        score = log_normalize(1, 10)
        self.assertGreater(score, 20.0)   # Not worthless

    def test_zero_saturation_returns_zero(self):
        """Guard: saturation=0 is invalid; returns 0.0 safely."""
        self.assertEqual(log_normalize(5, 0), 0.0)


class TestDistanceDecay(unittest.TestCase):

    def test_zero_distance_returns_1(self):
        self.assertAlmostEqual(distance_decay(0, 1000), 1.0, places=5)

    def test_full_radius_gives_low_weight(self):
        w = distance_decay(1000, 1000)
        self.assertLess(w, 0.10)   # ~0.05 at the edge

    def test_half_radius_gives_moderate_weight(self):
        w = distance_decay(500, 1000)
        self.assertGreater(w, 0.15)
        self.assertLess(w,    0.35)

    def test_monotonically_decreasing(self):
        weights = [distance_decay(d, 1000) for d in [0, 100, 300, 500, 800, 1000]]
        self.assertEqual(weights, sorted(weights, reverse=True))

    def test_clamp(self):
        self.assertEqual(clamp(-5), 0.0)
        self.assertEqual(clamp(150), 100.0)
        self.assertEqual(clamp(50), 50.0)


# ── Distance Service ──────────────────────────────────────────────────────────

class TestHaversineDistanceService(unittest.TestCase):

    def setUp(self):
        self.svc = HaversineDistanceService()

    def test_same_point_is_zero(self):
        self.assertAlmostEqual(self.svc.distance(28.63, 77.22, 28.63, 77.22), 0.0, places=2)

    def test_known_distance_delhi_to_noida(self):
        # Connaught Place → Sector 18 Noida ≈ 18km
        d = self.svc.distance(28.6315, 77.2167, 28.5697, 77.3219)
        self.assertGreater(d, 10_000)
        self.assertLess(d,    25_000)

    def test_nearest_returns_closest(self):
        far  = _make_feature(lat=28.65, lon=77.22)
        near = _make_feature(lat=28.632, lon=77.217)
        nearest = self.svc.nearest([far, near], 28.6315, 77.2167)
        self.assertLess(nearest, 500)   # near feature is < 500m

    def test_nearest_with_no_coordinates_returns_none(self):
        f = _make_feature(lat=None, lon=None)
        self.assertIsNone(self.svc.nearest([f], 28.63, 77.22))

    def test_weighted_count_closer_features_weigh_more(self):
        near_feat = _make_feature(lat=28.632, lon=77.217)
        far_feat  = _make_feature(lat=28.64,  lon=77.23)
        wc_near   = self.svc.weighted_count([near_feat],  28.6315, 77.2167, 1000)
        wc_far    = self.svc.weighted_count([far_feat],   28.6315, 77.2167, 1000)
        self.assertGreater(wc_near, wc_far)

    def test_weighted_count_no_coords_uses_fallback(self):
        f = _make_feature(lat=None, lon=None)
        wc = self.svc.weighted_count([f], 28.63, 77.22, 1000)
        self.assertAlmostEqual(wc, 0.5, places=3)   # mid-weight fallback


# ── Density Service ───────────────────────────────────────────────────────────

class TestDensityService(unittest.TestCase):

    def test_density_1km_radius(self):
        """1km radius → area=π≈3.14 km². 10 features → ~3.18/km²."""
        d = DensityService.density(10, 1000)
        self.assertAlmostEqual(d, 10 / (math.pi), places=2)

    def test_density_zero_count(self):
        self.assertEqual(DensityService.density(0, 1000), 0.0)

    def test_density_all_returns_dict(self):
        counts = {"restaurants": 20, "banks": 5}
        result = DensityService.density_all(counts, 1000)
        self.assertIn("restaurants", result)
        self.assertIn("banks", result)
        self.assertGreater(result["restaurants"], result["banks"])

    def test_summary_has_area(self):
        s = DensityService.summary({"roads": 100}, 1000)
        self.assertIn("area_km2",  s)
        self.assertIn("densities", s)
        self.assertAlmostEqual(s["area_km2"], math.pi, places=2)


# ── Road Service ──────────────────────────────────────────────────────────────

class TestRoadService(unittest.TestCase):

    def test_motorway_has_highest_weight(self):
        self.assertEqual(ROAD_QUALITY_WEIGHTS["motorway"], 1.0)

    def test_footway_has_low_weight(self):
        self.assertLess(ROAD_QUALITY_WEIGHTS["footway"], 0.15)

    def test_primary_road_analysis(self):
        road = _make_feature(lat=28.632, lon=77.217, tags={"highway": "primary"})
        result = RoadService.analyse([road], 28.6315, 77.2167, 1000)
        self.assertIn("primary", result["road_type_counts"])
        self.assertGreater(result["quality_score"], 0)
        self.assertEqual(result["high_quality_count"], 1)

    def test_residential_road_lower_quality_than_primary(self):
        road_p = _make_feature(lat=28.632, lon=77.217, tags={"highway": "primary"})
        road_r = _make_feature(lat=28.632, lon=77.217, tags={"highway": "residential"})
        r_primary = RoadService.analyse([road_p], 28.6315, 77.2167, 1000)
        r_resid   = RoadService.analyse([road_r], 28.6315, 77.2167, 1000)
        self.assertGreater(r_primary["quality_score"], r_resid["quality_score"])

    def test_empty_roads_gives_zero(self):
        result = RoadService.analyse([], 28.63, 77.22, 1000)
        self.assertEqual(result["quality_score"], 0.0)
        self.assertEqual(result["total_roads"],   0)

    def test_label_excellent_for_high_score(self):
        roads = [
            _make_feature(lat=28.6315+i*0.001, lon=77.2167, tags={"highway": "primary"})
            for i in range(5)
        ]
        result = RoadService.analyse(roads, 28.6315, 77.2167, 1000)
        self.assertEqual(result["road_quality_label"], "Excellent")

    def test_nearest_primary_populated(self):
        road = _make_feature(lat=28.632, lon=77.217, tags={"highway": "primary"})
        result = RoadService.analyse([road], 28.6315, 77.2167, 1000)
        self.assertIsNotNone(result["nearest_primary_m"])
        self.assertGreater(result["nearest_primary_m"], 0)


# ── Competition Service ───────────────────────────────────────────────────────

class TestCompetitionService(unittest.TestCase):

    def test_retail_detects_supermarket(self):
        feat = _make_feature(lat=28.63, lon=77.22, tags={"shop": "supermarket"})
        result = CompetitionService.detect(
            {"shops": [feat]}, "retail", 28.6315, 77.2167, 1000
        )
        self.assertEqual(result["competitor_count"], 1)
        self.assertIn("shop=supermarket", result["competitor_breakdown"])

    def test_hospital_type_detects_clinics(self):
        feat = _make_feature(lat=28.63, lon=77.22, tags={"amenity": "clinic"})
        result = CompetitionService.detect(
            {"hospitals": [feat]}, "hospital", 28.6315, 77.2167, 1000
        )
        self.assertEqual(result["competitor_count"], 1)

    def test_ev_station_detects_charging(self):
        feat = _make_feature(lat=28.63, lon=77.22, tags={"amenity": "charging_station"})
        result = CompetitionService.detect(
            {"misc": [feat]}, "ev_station", 28.6315, 77.2167, 1000
        )
        self.assertEqual(result["competitor_count"], 1)

    def test_no_matching_tags_returns_zero(self):
        feat = _make_feature(lat=28.63, lon=77.22, tags={"amenity": "parking"})
        result = CompetitionService.detect(
            {"misc": [feat]}, "retail", 28.6315, 77.2167, 1000
        )
        self.assertEqual(result["competitor_count"], 0)

    def test_unknown_type_returns_zero(self):
        result = CompetitionService.detect({}, "unknown_type", 28.63, 77.22, 1000)
        self.assertEqual(result["competitor_count"], 0)

    def test_weighted_competitor_closer_is_more_threatening(self):
        near = _make_feature(lat=28.6316, lon=77.2168, tags={"shop": "supermarket"})
        far  = _make_feature(lat=28.650,  lon=77.230,  tags={"shop": "supermarket"})
        r_near = CompetitionService.detect({"s": [near]}, "retail", 28.6315, 77.2167, 1000)
        r_far  = CompetitionService.detect({"s": [far]},  "retail", 28.6315, 77.2167, 1000)
        self.assertGreater(
            r_near["weighted_competitor_count"],
            r_far["weighted_competitor_count"],
        )

    def test_all_business_types_have_profiles(self):
        for btype in ("retail", "hospital", "ev_station", "warehouse"):
            result = CompetitionService.detect({}, btype, 0, 0, 1000)
            self.assertIsInstance(result["competitor_count"], int)


# ── Confidence Calculator ─────────────────────────────────────────────────────

class TestConfidenceCalculator(unittest.TestCase):

    def test_rich_data_gives_high_confidence(self):
        counts = {"roads": 50, "restaurants": 20, "banks": 10,
                  "bus_stops": 5, "hospitals": 3, "schools": 4,
                  "fuel_stations": 2, "parks": 3}
        result = ConfidenceCalculator.calculate(
            counts, osm_error=None, total_features=200, is_enriched=True
        )
        self.assertGreater(result["score"], 75)
        self.assertEqual(result["label"], "High")

    def test_osm_error_reduces_confidence(self):
        r_ok  = ConfidenceCalculator.calculate({}, None, 50)
        r_err = ConfidenceCalculator.calculate({}, "timeout", 50)
        self.assertLess(r_err["score"], r_ok["score"])

    def test_no_features_returns_low_confidence(self):
        result = ConfidenceCalculator.calculate({}, None, 0)
        self.assertLess(result["score"], 50)

    def test_enriched_bonus(self):
        r_plain  = ConfidenceCalculator.calculate({"roads": 20}, None, 20, is_enriched=False)
        r_enrich = ConfidenceCalculator.calculate({"roads": 20}, None, 20, is_enriched=True)
        self.assertGreater(r_enrich["score"], r_plain["score"])

    def test_score_clamped_0_to_100(self):
        result = ConfidenceCalculator.calculate({"roads": 1000}, None, 10000, is_enriched=True)
        self.assertLessEqual(result["score"], 100.0)
        self.assertGreaterEqual(result["score"], 0.0)

    def test_penalties_list_populated_on_errors(self):
        result = ConfidenceCalculator.calculate({}, "API error", 0)
        self.assertGreater(len(result["penalties"]), 0)


# ── Explainability Builder ────────────────────────────────────────────────────

class TestExplainabilityBuilder(unittest.TestCase):

    def _builder(self, **ctx_overrides):
        ctx = {
            "lat": 28.63, "lon": 77.22, "radius_m": 1000,
            "business_type": "retail",
            "density_metrics":    {"restaurants": 5.0},
            "distance_metrics":   {"hospitals": {"nearest_distance": 300}},
            "road_hierarchy":     {"road_quality_label": "Good", "dominant_type": "secondary",
                                   "high_quality_count": 5},
            "competition_metrics":{"competitor_count": 2, "weighted_competitor_count": 1.4,
                                   "competitor_breakdown": {"shop=supermarket": 2}},
        }
        ctx.update(ctx_overrides)
        return ExplainabilityBuilder(ctx)

    def test_accessibility_explanation_is_string(self):
        b = self._builder()
        expl = b.build("accessibility", {"score": 75, "inputs": {"roads": 50, "bus_stops": 5}})
        self.assertIsInstance(expl, str)
        self.assertGreater(len(expl), 10)

    def test_infrastructure_explanation_mentions_hospitals(self):
        b = self._builder()
        expl = b.build("infrastructure", {
            "score": 80,
            "inputs": {"hospitals": 3, "schools": 5, "banks": 10, "fuel_stations": 2}
        })
        self.assertIn("hospital", expl.lower())

    def test_competition_explanation_mentions_competitors(self):
        b = self._builder()
        expl = b.build("competition", {"score": 60, "inputs": {}})
        self.assertIn("2", expl)   # competitor count in text

    def test_environment_no_parks_mentions_search_radius(self):
        b = self._builder()
        expl = b.build("environment", {"score": 0, "inputs": {"parks": 0}})
        self.assertIn("park", expl.lower())

    def test_generic_fallback_for_unknown_factor(self):
        b = self._builder()
        expl = b.build("unknown_factor", {"score": 60, "inputs": {}})
        self.assertIn("60", expl)

    def test_tier_labels(self):
        b = self._builder()
        self.assertEqual(b._tier(85), "Excellent")
        self.assertEqual(b._tier(65), "Good")
        self.assertEqual(b._tier(45), "Fair")
        self.assertEqual(b._tier(25), "Low")
        self.assertEqual(b._tier(10), "Very low")


# ── Engine Phase 3 Final ──────────────────────────────────────────────────────

class TestScoringEnginePhase3Final(unittest.TestCase):

    def test_count_only_mode_still_works(self):
        """Backwards compat: count dict → ScoreResult with no extended metrics."""
        engine = ScoringEngine()
        result = engine.calculate(
            feature_counts={"roads": 50, "bus_stops": 5, "hospitals": 2,
                            "schools": 3, "banks": 10, "fuel_stations": 1,
                            "restaurants": 30, "parks": 4},
            business_type="retail",
        )
        self.assertGreater(result.overall, 0)
        self.assertLessEqual(result.overall, 100)
        self.assertIn("accessibility", result.factors)

    def test_result_has_confidence(self):
        engine = ScoringEngine()
        result = engine.calculate({"roads": 10}, "retail")
        self.assertIsInstance(result.confidence, dict)
        self.assertIn("score", result.confidence)
        self.assertIn("label", result.confidence)

    def test_result_has_normalization_metadata(self):
        engine = ScoringEngine()
        result = engine.calculate({"roads": 10}, "retail")
        self.assertEqual(result.normalization_metadata["method"], "logarithmic")

    def test_to_raw_factors_has_meta(self):
        engine = ScoringEngine()
        result = engine.calculate({"roads": 10, "parks": 2, "hospitals": 1,
                                   "schools": 1, "banks": 1, "fuel_stations": 1,
                                   "restaurants": 5, "bus_stops": 2}, "retail")
        rf = result.to_raw_factors()
        self.assertIn("_meta", rf)
        self.assertIn("confidence",             rf["_meta"])
        self.assertIn("normalization_metadata", rf["_meta"])

    def test_deterministic_count_mode(self):
        """Same inputs → same output on repeated calls."""
        engine  = ScoringEngine()
        counts  = {"roads": 84, "bus_stops": 12, "hospitals": 2,
                   "schools": 5, "banks": 15, "fuel_stations": 3,
                   "restaurants": 45, "parks": 3}
        result1 = engine.calculate(counts, "retail")
        result2 = engine.calculate(counts, "retail")
        self.assertEqual(result1.overall, result2.overall)

    def test_business_type_changes_score(self):
        engine = ScoringEngine()
        counts = {"roads": 50, "hospitals": 8, "schools": 3, "banks": 5,
                  "fuel_stations": 2, "restaurants": 20, "bus_stops": 4, "parks": 2}
        r_retail  = engine.calculate(counts, "retail")
        r_hospital = engine.calculate(counts, "hospital")
        self.assertNotEqual(r_retail.overall, r_hospital.overall)

    def test_factor_explanations_non_empty(self):
        engine = ScoringEngine()
        result = engine.calculate({"roads": 50, "bus_stops": 5, "hospitals": 2,
                                   "schools": 3, "banks": 10, "fuel_stations": 1,
                                   "restaurants": 30, "parks": 4}, "retail")
        for key, factor in result.factors.items():
            self.assertIsInstance(factor.explanation, str, f"Empty explanation for {key}")
            self.assertGreater(len(factor.explanation), 5, f"Too short for {key}")


if __name__ == "__main__":
    unittest.main()
