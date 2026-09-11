from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategorieViewSet,
    DocumentViewSet,
    MessageChatViewSet,
    ProcedureViewSet,
    UtilisateurViewSet,
    home,
)


router = DefaultRouter()
router.register(r"utilisateurs", UtilisateurViewSet, basename="utilisateur")
router.register(r"categories", CategorieViewSet, basename="categorie")
router.register(r"procedures", ProcedureViewSet, basename="procedure")
router.register(r"documents", DocumentViewSet, basename="document")
router.register(r"messages-chat", MessageChatViewSet, basename="messagechat")


urlpatterns = [
    path("", home, name="home"),
    path("", include(router.urls)),
]

