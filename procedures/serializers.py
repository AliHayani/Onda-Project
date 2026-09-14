from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Categorie, ChatSession, Document, MessageChat, Notification, Procedure
from .permissions import can_edit_procedure


Utilisateur = get_user_model()


class UtilisateurSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = Utilisateur
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "service",
            "is_active",
            "is_staff",
            "date_joined",
            "last_login",
            "password",
        )
        read_only_fields = ["date_joined", "last_login"]
        extra_kwargs = {
            "password": {"write_only": True, "required": False},
            "is_staff": {"read_only": True},
            "role": {"read_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request") if self.context else None
        user = getattr(request, "user", None)
        is_admin = bool(
            getattr(user, "is_staff", False)
            or getattr(user, "role", None) == getattr(Utilisateur, "ROLE_ADMIN", "admin")
        )
        if is_admin:
            self.fields["role"].read_only = False
            self.fields["is_staff"].read_only = False

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        validated_data["role"] = Utilisateur.ROLE_USER
        user = Utilisateur(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        request = self.context.get("request") if self.context else None
        user = getattr(request, "user", None)
        is_admin = bool(
            getattr(user, "is_staff", False)
            or getattr(user, "role", None) == getattr(Utilisateur, "ROLE_ADMIN", "admin")
        )

        if not is_admin:
            validated_data.pop("role", None)
            validated_data.pop("is_active", None)
            validated_data.pop("is_staff", None)

        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = "__all__"


class ProcedureSerializer(serializers.ModelSerializer):
    version = serializers.FloatField()
    createur_username = serializers.CharField(source="createur.username", read_only=True)
    categorie_nom = serializers.CharField(source="categorie.nom", read_only=True)
    date_creation = serializers.DateTimeField(read_only=True)

    def _is_admin(self, user):
        return bool(
            getattr(user, "is_staff", False)
            or getattr(user, "role", None) == getattr(Utilisateur, "ROLE_ADMIN", "admin")
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request") if self.context else None
        user = getattr(request, "user", None)
        if not self._is_admin(user):
            self.fields["version"].read_only = True
            self.fields["statut"].read_only = True

    def validate_version(self, value):
        if value is None:
            return value
        return round(max(float(value), 1.0), 1)

    def validate(self, attrs):
        next_status = attrs.get("statut")
        current_reason = getattr(self.instance, "motif_refus", "") if self.instance else ""
        next_reason = attrs.get("motif_refus", current_reason)
        if next_status == Procedure.STATUT_REFUSE and not str(next_reason or "").strip():
            raise serializers.ValidationError({"motif_refus": "A rejection reason is required."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request") if self.context else None
        user = getattr(request, "user", None)
        if not self._is_admin(user):
            validated_data.pop("version", None)
            validated_data["statut"] = Procedure.STATUT_BROUILLON
        return super().create(validated_data)

    def update(self, instance, validated_data):
        user = getattr(self.context.get("request"), "user", None)
        is_admin = self._is_admin(user)

        if is_admin:
            instance._allow_validated_update = True

        if "version" in validated_data:
            if is_admin:
                instance._version_manually_set = True
            else:
                validated_data.pop("version", None)
        if not is_admin:
            validated_data.pop("statut", None)
        return super().update(instance, validated_data)

    class Meta:
        model = Procedure
        fields = "__all__"
        read_only_fields = ("createur", "createur_username")


class DocumentSerializer(serializers.ModelSerializer):
    fichier_url = serializers.SerializerMethodField()
    nom_fichier = serializers.SerializerMethodField()

    def get_fichier_url(self, obj):
        if not obj.fichier:
            return ""

        request = self.context.get("request") if self.context else None
        if request:
            return request.build_absolute_uri(obj.fichier.url)

        return obj.fichier.url

    def get_nom_fichier(self, obj):
        if not obj.fichier:
            return ""

        return obj.fichier.name.rsplit("/", 1)[-1]

    def validate_procedure(self, procedure):
        request = self.context.get("request") if self.context else None
        user = getattr(request, "user", None)

        if not can_edit_procedure(user, procedure):
            raise serializers.ValidationError("You are not allowed to attach documents to this procedure.")

        return procedure

    class Meta:
        model = Document
        fields = "__all__"
        read_only_fields = ("date_ajout", "fichier_url", "nom_fichier")


class ChatSessionSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    latest_message = serializers.SerializerMethodField()
    latest_message_date = serializers.SerializerMethodField()

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_latest_message(self, obj):
        message = obj.messages.order_by("-date_envoi").first()
        return message.contenu_message if message else ""

    def get_latest_message_date(self, obj):
        message = obj.messages.order_by("-date_envoi").first()
        return message.date_envoi if message else obj.date_modification

    class Meta:
        model = ChatSession
        fields = (
            "id",
            "session_title",
            "date_creation",
            "date_modification",
            "latest_message",
            "latest_message_date",
            "message_count",
        )


class MessageChatSerializer(serializers.ModelSerializer):
    session_title = serializers.SerializerMethodField()

    def get_session_title(self, obj):
        return getattr(obj.session, "session_title", "New chat")

    class Meta:
        model = MessageChat
        fields = "__all__"


class AdminChatUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    total_messages = serializers.IntegerField()
    last_message_at = serializers.DateTimeField()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ("utilisateur", "date_creation")
