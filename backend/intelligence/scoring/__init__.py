"""intelligence/scoring/__init__.py — Phase 3 Final"""

from .engine          import ScoringEngine
from .types           import FactorScore, ScoreResult
from .explainability  import ExplainabilityBuilder
from .confidence      import ConfidenceCalculator
from .normalization   import log_normalize, sigmoid_normalize, distance_decay, clamp
from .services        import DistanceService, HaversineDistanceService, get_distance_service
from .services        import DensityService, RoadService, CompetitionService

__all__ = [
    # Core
    "ScoringEngine", "FactorScore", "ScoreResult",
    # Phase 3 Final
    "ExplainabilityBuilder", "ConfidenceCalculator",
    "log_normalize", "sigmoid_normalize", "distance_decay", "clamp",
    "DistanceService", "HaversineDistanceService", "get_distance_service",
    "DensityService", "RoadService", "CompetitionService",
]
