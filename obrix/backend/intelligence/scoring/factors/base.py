"""
Abstract base class for all scoring factors.
Every factor MUST implement this interface.
"""

from abc import ABC, abstractmethod
from typing import Tuple, Dict


class AbstractFactor(ABC):
    """
    Base class for all geospatial scoring factors.

    Subclasses must define:
        key (str): Unique identifier used in score_breakdown dict
        compute() -> (float, dict): Returns (score_0_to_100, raw_data)
    """

    key: str = NotImplemented

    def __init__(self, lat: float, lon: float, radius_m: int, osm_data: dict):
        self.lat = lat
        self.lon = lon
        self.radius_m = radius_m
        self.osm_data = osm_data

    @abstractmethod
    def compute(self) -> Tuple[float, Dict]:
        """
        Compute the factor score.

        Returns:
            score (float): 0–100, higher is better
            raw_data (dict): Intermediate values for debugging and ML training
        """
        raise NotImplementedError
