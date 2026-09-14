from django.contrib import admin

from .models import Categorie, Document, MessageChat, Notification, Procedure, Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "service", "is_active", "is_staff", "date_joined")
    list_filter = ("role", "service", "is_active", "is_staff")
    search_fields = ("username", "email", "first_name", "last_name", "service")
    ordering = ("username",)


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ("nom", "service_associe")
    list_filter = ("service_associe",)
    search_fields = ("nom", "service_associe")
    ordering = ("nom",)


@admin.register(Procedure)
class ProcedureAdmin(admin.ModelAdmin):
    list_display = ("titre", "categorie", "createur", "statut", "version", "date_modification")
    list_filter = ("statut", "categorie", "createur")
    search_fields = ("titre", "description", "motif_refus")
    ordering = ("-date_modification",)


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("procedure", "fichier", "date_ajout")
    list_filter = ("date_ajout",)
    search_fields = ("procedure__titre",)
    ordering = ("-date_ajout",)


@admin.register(MessageChat)
class MessageChatAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "date_envoi", "contenu_message", "reponse_bot")
    list_filter = ("date_envoi",)
    search_fields = ("utilisateur__username", "contenu_message", "reponse_bot")
    ordering = ("-date_envoi",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "titre", "lue", "date_creation")
    list_filter = ("lue", "date_creation")
    search_fields = ("utilisateur__username", "titre", "message")
