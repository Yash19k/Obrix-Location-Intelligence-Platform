"""
Serializers for the locations app.

SavedLocation uses a PostGIS PointField internally.
The API accepts/returns plain latitude + longitude floats for simplicity.
The PointField is constructed from lat/lon in the create/update flow.
"""

from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import SavedLocation


class SavedLocationSerializer(serializers.ModelSerializer):
    """
    Serialize SavedLocation to/from plain lat/lon floats.

    The PostGIS PointField is hidden from the API surface —
    clients only ever see latitude and longitude as decimal numbers.
    """

    latitude = serializers.FloatField(write_only=False)
    longitude = serializers.FloatField(write_only=False)

    class Meta:
        model = SavedLocation
        fields = (
            "id", "name", "description", "address",
            "latitude", "longitude",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
        # Exclude the raw 'point' field — exposed via lat/lon properties
        extra_kwargs = {
            "point": {"write_only": True, "required": False},
        }

    def validate_latitude(self, value):
        if not (-90 <= value <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if not (-180 <= value <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def create(self, validated_data):
        lat = validated_data.pop("latitude")
        lon = validated_data.pop("longitude")
        validated_data["point"] = Point(lon, lat, srid=4326)
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        lat = validated_data.pop("latitude", None)
        lon = validated_data.pop("longitude", None)
        if lat is not None and lon is not None:
            validated_data["point"] = Point(lon, lat, srid=4326)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Return lat/lon from the PointField properties."""
        data = super().to_representation(instance)
        # Overwrite with actual PointField values (covers read path)
        data["latitude"] = instance.latitude
        data["longitude"] = instance.longitude
        return data
