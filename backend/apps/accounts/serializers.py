"""
Serializers for the accounts app.

- RegisterSerializer:              Validates and creates a new user
- UserProfileSerializer:           Read/update the authenticated user's profile
- CustomTokenObtainPairSerializer: Extends JWT response with user metadata
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles user registration.
    Password is write-only and confirmed via password2.
    """

    password = serializers.CharField(
        write_only=True, min_length=8, style={"input_type": "password"}
    )
    password2 = serializers.CharField(
        write_only=True, style={"input_type": "password"}, label="Confirm password"
    )

    class Meta:
        model = User
        fields = ("email", "full_name", "password", "password2")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    """Read and update the current user's non-sensitive profile fields."""

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "plan", "created_at")
        read_only_fields = ("id", "email", "plan", "created_at")


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extend the default JWT pair response to include user data.
    The frontend can bootstrap its state without a second /me request.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserProfileSerializer(self.user).data
        return data
