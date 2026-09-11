from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.db.models import Q
import os
from pathlib import Path
from dotenv import load_dotenv
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

try:
    from groq import Groq
except Exception:  # pragma: no cover - fallback for environments without the vendored package
    Groq = None

from .models import Categorie, Document, MessageChat, Procedure
from .permissions import DocumentPermission, ProcedurePermission, is_admin_user
from .serializers import (
    CategorieSerializer,
    DocumentSerializer,
    MessageChatSerializer,
    ProcedureSerializer,
    UtilisateurSerializer,
)

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

groq_api_key = os.getenv('GROQ_API_KEY')
if Groq is not None and groq_api_key:
    client = Groq(api_key=groq_api_key)
else:
    client = None


Utilisateur = get_user_model()


def home(request):
    return JsonResponse({"message": "API is running"})


class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        if self.request.user and is_admin_user(self.request.user):
            return self.queryset
        if self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            return self.queryset.filter(pk=self.request.user.pk)
        return self.queryset


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    permission_classes = [IsAuthenticated]


class ProcedureViewSet(viewsets.ModelViewSet):
    queryset = Procedure.objects.all()
    serializer_class = ProcedureSerializer
    permission_classes = [ProcedurePermission]

    def get_queryset(self):
        queryset = Procedure.objects.select_related("categorie", "createur").all()

        categorie_id = self.request.query_params.get("categorie")
        date_order = self.request.query_params.get("date_order")
        statut = self.request.query_params.get("statut")

        if categorie_id:
            queryset = queryset.filter(categorie_id=categorie_id)

        if statut:
            queryset = queryset.filter(statut=statut)

        if date_order == "earliest":
            queryset = queryset.order_by("date_creation", "id")
        elif date_order == "latest":
            queryset = queryset.order_by("-date_creation", "-id")
        else:
            queryset = queryset.order_by("-date_creation", "-id")

        if is_admin_user(self.request.user):
            return queryset

        if self.action == "list":
            return queryset.filter(
                Q(statut=Procedure.STATUT_VALIDE)
                | Q(statut=Procedure.STATUT_BROUILLON, createur=self.request.user)
            )

        return queryset

    @action(detail=False, methods=["get"], url_path="pending-count")
    def pending_count(self, request):
        if not is_admin_user(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        pending_count = self.get_queryset().filter(statut=Procedure.STATUT_BROUILLON).count()
        return Response({"pending_count": pending_count})

    def perform_create(self, serializer):
        serializer.save(createur=self.request.user)


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [DocumentPermission]

    def get_queryset(self):
        queryset = Document.objects.select_related("procedure", "procedure__createur").all()
        procedure_id = self.request.query_params.get("procedure")

        if procedure_id:
            queryset = queryset.filter(procedure_id=procedure_id)

        if is_admin_user(self.request.user):
            return queryset

        return queryset.filter(
            Q(procedure__statut=Procedure.STATUT_VALIDE)
            | Q(procedure__statut=Procedure.STATUT_BROUILLON, procedure__createur=self.request.user)
        )


class MessageChatViewSet(viewsets.ModelViewSet):
    queryset = MessageChat.objects.all()
    serializer_class = MessageChatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if is_admin_user(self.request.user):
            return self.queryset.select_related('utilisateur').all()
        return self.queryset.filter(utilisateur=self.request.user)


class ChatbotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def _generate_local_response(self, contenu_message: str) -> str:
        normalized = (contenu_message or '').strip().lower()
        if not normalized:
            return "Please ask a question about procedures, document attachments, workflow status, or account access."

        if "create" in normalized and "account" in normalized:
            return (
                "Account creation is handled through the login page or by your system administrator. "
                "If your organization supports self-registration, use the register link on the login screen."
            )

        if "login" in normalized or "sign in" in normalized or "register" in normalized:
            return (
                "To access the platform, use the login page and enter your assigned credentials. "
                "If you do not have an account yet, contact your administrator to get access."
            )

        if "edit" in normalized and "procedure" in normalized:
            return (
                "You can edit a procedure while it is in draft status. Once a procedure is validated, it is locked and cannot be changed. "
                "If you need to update a validated procedure, ask an administrator for the next revision process."
            )

        if "procedure" in normalized and ("post" in normalized or "submit" in normalized or "publish" in normalized):
            return (
                "A procedure remains editable while it is a draft. After validation, the procedure becomes final and requires a new revision for changes. "
                "Use the procedure editor for draft updates and ensure your documents are complete before submitting."
            )

        if "document" in normalized or "attachment" in normalized:
            return (
                "Check the related procedure's document section to verify required attachments. "
                "All supporting files should be uploaded and approved before the procedure can be validated."
            )

        if "status" in normalized or "statut" in normalized:
            return (
                "Procedures use draft, validated, and refused status values. Drafts are editable by the creator, validated procedures are locked, and refused procedures may require correction before resubmission."
            )

        if "help" in normalized or "support" in normalized or "question" in normalized:
            return (
                "I can help with procedure creation, editing, approval status, document requirements, and account access. "
                "Please ask a specific question about the platform."
            )

        return (
            "I am here to support your use of the procedure platform. "
            "Please ask a specific question about procedures, documents, approvals, or account access so I can give you a professional response."
        )

    def post(self, request, *args, **kwargs):
        contenu_message = request.data.get('contenu_message', '')

        if client is None:
            reponse_texte = self._generate_local_response(contenu_message)
        else:
            try:
                chat_completion = client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a professional support assistant for this procedure management platform. "
                                "Answer user questions directly, clearly, and politely. Focus on procedure creation, editing, validation, document workflows, and account access. "
                                "If the user asks about something outside this platform, explain that you can only support platform-related topics."
                            ),
                        },
                        {
                            "role": "user",
                            "content": contenu_message,
                        }
                    ],
                    model="llama-3.1-8b-instant",
                )
                reponse_texte = chat_completion.choices[0].message.content
            except Exception:
                reponse_texte = self._generate_local_response(contenu_message)

        MessageChat.objects.create(
            utilisateur=request.user,
            contenu_message=contenu_message,
            reponse_bot=reponse_texte,
        )
        return Response({"reponse": reponse_texte})

    def get(self, request, *args, **kwargs):
        messages = MessageChat.objects.filter(utilisateur=request.user)
        serializer = MessageChatSerializer(messages, many=True)
        return Response(serializer.data)
