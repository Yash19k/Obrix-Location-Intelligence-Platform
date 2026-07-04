"""
Custom DRF permissions.

IsOwner:       Object-level permission — user must own the object.
IsPremiumUser: User must have plan='pro' or plan='enterprise'.
"""

from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Allow access only to the owner of the object.
    The model must have a `user` ForeignKey field.
    """

    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsPremiumUser(BasePermission):
    """
    Allow access only to users on the 'pro' or 'enterprise' plan.
    Used for gating advanced features like PDF export and ML scoring.
    """

    message = "This feature requires a Pro or Enterprise plan."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.plan in ("pro", "enterprise")
        )
