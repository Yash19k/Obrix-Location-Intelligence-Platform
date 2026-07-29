"""
SavedLocation model — stores user-bookmarked analysis sites.

Uses PostGIS PointField (EPSG:4326 / WGS84) for native spatial queries.
Requires: PostgreSQL 18 + PostGIS 3.6.2 + django.contrib.gis.
"""

import uuid
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point


class SavedLocation(models.Model):
    """A geographic point the user has saved for future analysis."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="saved_locations",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # PostGIS PointField — EPSG:4326 (WGS84 latitude/longitude)
    # geography=True enables accurate distance calculations in metres
    point = models.PointField(srid=4326, geography=True)

    address = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "locations_savedlocation"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user"])]

    def __str__(self):
        return f"{self.name} ({self.user.email})"

    # ------------------------------------------------------------------
    # Convenience properties — expose lat/lon as floats for the API
    # ------------------------------------------------------------------

    @property
    def latitude(self) -> float:
        """WGS84 latitude (Y coordinate)."""
        return self.point.y

    @property
    def longitude(self) -> float:
        """WGS84 longitude (X coordinate)."""
        return self.point.x

    @classmethod
    def from_lat_lon(cls, lat: float, lon: float, **kwargs) -> "SavedLocation":
        """
        Factory method — create a SavedLocation from lat/lon floats.
        Note: Point(x, y) = Point(lon, lat) in GEOS convention.
        """
        kwargs["point"] = Point(lon, lat, srid=4326)
        return cls(**kwargs)
