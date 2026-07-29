"""
PopulationFactor — Phase 6 will implement the real geospatial computation.
Returns a stub score of 50.0 until OSM data is integrated.
"""

from typing import Tuple, Dict
from .base import AbstractFactor


class PopulationFactor(AbstractFactor):
    key = "population"

    def compute(self) -> Tuple[float, Dict]:
        # TODO Phase 6: implement real computation using self.osm_data
        return 50.0, {"stub": True, "note": "Phase 6 implementation pending"}
