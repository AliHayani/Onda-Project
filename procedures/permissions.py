from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Procedure, Utilisateur


def is_admin_user(user):
    return bool(
        user
        and user.is_authenticated
        and (getattr(user, "is_staff", False) or getattr(user, "role", None) == Utilisateur.ROLE_ADMIN)
    )


class ProcedurePermission(BasePermission):
    """
    Enforces procedure RBAC at the API boundary.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if view.action == "destroy":
            return is_admin_user(request.user)

        return True

    def has_object_permission(self, request, view, obj):
        if view.action == "destroy":
            return is_admin_user(request.user) and obj.statut == Procedure.STATUT_VALIDE

        if is_admin_user(request.user):
            return True

        if request.method in SAFE_METHODS:
            return obj.statut == Procedure.STATUT_VALIDE or (
                obj.statut == Procedure.STATUT_BROUILLON and obj.createur_id == request.user.id
            )

        if view.action in ("update", "partial_update"):
            return obj.statut == Procedure.STATUT_BROUILLON and obj.createur_id == request.user.id

        return False


def can_edit_procedure(user, procedure):
    if is_admin_user(user):
        return True

    return bool(
        user
        and user.is_authenticated
        and procedure.statut == Procedure.STATUT_BROUILLON
        and procedure.createur_id == user.id
    )


def can_view_procedure(user, procedure):
    if is_admin_user(user):
        return True

    return bool(
        procedure.statut == Procedure.STATUT_VALIDE
        or (
            user
            and user.is_authenticated
            and procedure.statut == Procedure.STATUT_BROUILLON
            and procedure.createur_id == user.id
        )
    )


class DocumentPermission(BasePermission):
    """
    Documents inherit access from their parent procedure.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return can_view_procedure(request.user, obj.procedure)

        if view.action in ("update", "partial_update", "destroy"):
            return can_edit_procedure(request.user, obj.procedure)

        return False
