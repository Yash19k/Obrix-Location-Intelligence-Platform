from intelligence.geo.overpass import OverpassClient

def get_osm_backend():
    """Deprecate factory: always return OverpassClient."""
    return OverpassClient()

__all__ = ["get_osm_backend"]


