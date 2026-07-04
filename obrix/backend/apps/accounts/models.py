"""
Custom User model for Obrix.

Decision: We extend AbstractBaseUser (not AbstractUser) because we use
email as the unique identifier instead of a username. This gives us
full control over the auth model without fighting Django defaults.
"""

import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Core user model — identified by email.
    The `plan` field gates premium features.
    """

    class Plan(models.TextChoices):
        FREE = "free", "Free"
        PRO = "pro", "Pro"
        ENTERPRISE = "enterprise", "Enterprise"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    plan = models.CharField(max_length=50, choices=Plan.choices, default=Plan.FREE)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        db_table = "accounts_user"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    @property
    def is_premium(self) -> bool:
        """Convenience property used by permission classes."""
        return self.plan in (self.Plan.PRO, self.Plan.ENTERPRISE)
