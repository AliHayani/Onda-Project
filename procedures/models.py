from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, MinValueValidator


class Utilisateur(AbstractUser):
    """
    Modèle utilisateur personnalisé.

    - Hérite de AbstractUser pour conserver l'authentification Django standard
    - Ajoute des informations métier (rôle + service)
    """
    ROLE_ADMIN = "admin"
    ROLE_USER = "user"

    ROLE_CHOICES = (
        (ROLE_ADMIN, "Admin"),
        (ROLE_USER, "User"),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_USER,
        help_text="Rôle fonctionnel de l'utilisateur dans le système.",
    )
    service = models.CharField(
        max_length=100,
        blank=True,
        help_text="Service / entité auquel l'utilisateur est rattaché (ex: RH, IT, Finance).",
    )

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"


class Categorie(models.Model):
    """
    Catégorie de procédures.

    Permet de classer les procédures et de les rattacher à un service.
    """
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    service_associe = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Service principalement concerné par cette catégorie.",
    )

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"

    def __str__(self) -> str:
        return self.nom


class Procedure(models.Model):
    """
    Procédure métier.

    La règle métier principale est la protection des procédures validées :
    une procédure dont le statut est 'validé' ne doit plus pouvoir être modifiée.
    """
    STATUT_BROUILLON = "brouillon"
    STATUT_VALIDE = "validé"
    STATUT_REFUSE = "refusé"

    STATUT_CHOICES = (
        (STATUT_BROUILLON, "Brouillon"),
        (STATUT_VALIDE, "Validé"),
        (STATUT_REFUSE, "Refusé"),
    )

    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    categorie = models.ForeignKey(
        Categorie,
        on_delete=models.PROTECT,
        related_name="procedures",
    )
    createur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="procedures_creees",
        null=True,
        blank=True,
    )
    version = models.FloatField(default=1.0, validators=[MinValueValidator(1.0)])
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUT_BROUILLON,
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Procédure"
        verbose_name_plural = "Procédures"

    def __str__(self) -> str:
        return f"{self.titre} (v{self.version})"

    def save(self, *args, **kwargs):
        """
        Règle métier critique :
        - une procédure déjà validée ne peut plus être modifiée.

        Important :
        - lors d'une création (pas encore de pk), la procédure n'est pas considérée comme "modifiée".
        - lors d'une mise à jour (pk existant), on vérifie l'état en base avant d'autoriser la sauvegarde.
        """
        version_value = float(self.version if self.version is not None else 1.0)
        version_value = max(version_value, 1.0)

        if self.pk:
            ancien = self.__class__.objects.only("statut", "version").get(pk=self.pk)
            if ancien.statut == self.STATUT_VALIDE and not getattr(self, "_allow_validated_update", False):
                raise ValidationError(
                    "Modification interdite : une procédure dont le statut est 'validé' ne peut plus être modifiée."
                )
            if not getattr(self, "_version_manually_set", False):
                version_value = max(version_value, float(ancien.version if ancien.version is not None else 1.0)) + 0.1

        self.version = round(max(version_value, 1.0), 1)

        self.full_clean()
        return super().save(*args, **kwargs)


class Document(models.Model):
    """
    Document joint à une procédure (table séparée).
    """
    procedure = models.ForeignKey(
        Procedure,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    fichier = models.FileField(
        upload_to="procedures/documents/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "odt", "ods"]
            )
        ],
    )
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"


class MessageChat(models.Model):
    """
    Historique des échanges d'un utilisateur (message) et du bot (réponse).
    """
    utilisateur = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name="messages_chat",
    )
    contenu_message = models.TextField()
    reponse_bot = models.TextField(blank=True)
    date_envoi = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message chat"
        verbose_name_plural = "Messages chat"
