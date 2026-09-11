from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.db.models import Q
import os
import unicodedata
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
        normalized = ''.join(
            character for character in unicodedata.normalize('NFKD', contenu_message or '')
            if not unicodedata.combining(character)
        ).strip().lower()
        if not normalized:
            return "Posez-moi une question sur les comptes, les procédures, les documents, les validations, l'historique du chat ou une page de la plateforme."

        french_terms = (
            "bonjour", "comment", "je veux", "je peux", "est-ce", "quelle", "quelles", "quel", "quels",
            "mot de passe", "compte", "procedure", "document", "fichier", "administrateur", "historique",
            "aide", "connexion", "inscription", "valide", "brouillon", "refuse", "telecharger", "creer",
        )
        is_french = any(term in normalized for term in french_terms)

        if is_french:
            if any(term in normalized for term in ("mot de passe", "oublie", "oublie mon")):
                return "Pour modifier votre mot de passe, ouvrez Paramètres, remplissez les champs du mot de passe, puis enregistrez. Si vous ne pouvez pas vous connecter, contactez un administrateur."
            if any(term in normalized for term in ("creer un compte", "créer un compte", "inscription", "nouveau compte")):
                return "Ouvrez la page Inscription et saisissez votre nom d'utilisateur, votre adresse e-mail et votre mot de passe. Un compte créé par inscription reçoit le rôle utilisateur par défaut."
            if any(term in normalized for term in ("connexion", "connecter", "se connecter", "login")):
                return "Ouvrez la page Connexion et saisissez vos identifiants. Si vous n'avez pas encore de compte, utilisez Inscription ou contactez un administrateur."
            if any(term in normalized for term in ("creer une procedure", "créer une procédure", "ajouter une procedure", "nouvelle procedure")):
                return "Ouvrez Procédures, choisissez Créer une procédure, puis renseignez le titre, la description et la catégorie. Enregistrez-la comme brouillon et ajoutez les documents nécessaires avant de la soumettre."
            if any(term in normalized for term in ("modifier", "edit", "changer")) and "procedur" in normalized:
                return "Une procédure peut être modifiée lorsqu'elle est en brouillon. Une procédure validée est normalement verrouillée ; contactez un administrateur pour demander une nouvelle révision."
            if any(term in normalized for term in ("soumettre", "valider", "validation", "approbation", "approuver")):
                return "Enregistrez la procédure comme brouillon, vérifiez sa description et ses documents, puis soumettez-la pour examen par un administrateur. Elle peut être validée ou refusée."
            if any(term in normalized for term in ("document", "fichier", "piece jointe", "telecharger", "upload")):
                return "Vous pouvez joindre des fichiers depuis la section Documents d'une procédure. Les formats acceptés sont PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, ODT et ODS."
            if any(term in normalized for term in ("statut", "brouillon", "valide", "refuse")):
                return "Les procédures ont trois statuts : brouillon, validée et refusée. Un brouillon peut être modifié par son créateur, une procédure validée est verrouillée et une procédure refusée peut être corrigée puis soumise à nouveau."
            if any(term in normalized for term in ("historique", "messages", "chat", "support", "conversation")):
                return "La section Support affiche vos derniers messages du jour pour poser rapidement une question. L'Historique du chat conserve toutes les conversations et permet de filtrer les messages par jour."
            if any(term in normalized for term in ("administrateur", "admin", "role", "droit", "permission")):
                return "Un administrateur peut gérer les utilisateurs, les catégories, les procédures, les documents et les journaux du chat. Un nouvel utilisateur reçoit d'abord le rôle utilisateur."
            if any(term in normalized for term in ("bonjour", "aide", "que peux-tu", "question")):
                return "Je peux vous aider avec les comptes, les procédures, les catégories, les brouillons, la validation, les documents, les permissions, le tableau de bord, le profil, les paramètres et l'historique du chat."

        if any(term in normalized for term in ("password", "mot de passe", "forgot", "oublie")):
            return (
                "To change your password, open Settings and use the password fields, then save your changes. "
                "If you cannot sign in, contact an administrator to reset your access."
            )

        if any(term in normalized for term in ("account", "compte", "register", "inscription")):
            return (
                "Use Sign up to create a user account with a username, email, and password. "
                "After registration, use Login to access the dashboard. New accounts have the standard user role; administrators manage elevated access."
            )

        if any(term in normalized for term in ("login", "log in", "sign in", "connexion", "connecter")):
            return (
                "Open Login and enter your username and password. After authentication, the platform takes you to your dashboard. "
                "Use Sign up for a new account or contact an administrator if your credentials do not work."
            )

        if any(term in normalized for term in ("procedure", "procedur")) and any(term in normalized for term in ("create", "new", "creer", "ajouter")):
            return (
                "Open Procedures and choose Create procedure. Enter a title, description, and category, then save it as a draft. "
                "You can attach supporting documents before submitting it for administrator review."
            )

        if any(term in normalized for term in ("edit", "modify", "change", "modifier")) and any(term in normalized for term in ("procedure", "procedur")):
            return (
                "A procedure can be edited while it is a draft. A validated procedure is locked; ask an administrator about the next revision if it needs changes. "
                "Administrators can manage validated procedures when an authorized revision is required."
            )

        if any(term in normalized for term in ("submit", "publish", "send", "soumettre", "validate", "approval", "approve", "approbation")):
            return (
                "Save the procedure as a draft, check its description and documents, then submit it for administrator review. "
                "Administrators can validate or refuse it. A validated procedure is visible to users and cannot normally be edited."
            )

        if any(term in normalized for term in ("document", "file", "attachment", "fichier", "piece jointe", "upload", "telecharger")):
            return (
                "Open a procedure and use its document area to upload supporting files. Accepted formats include PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, ODT, and ODS. "
                "Users can attach documents to their own drafts; administrators can manage documents according to their permissions."
            )

        if any(term in normalized for term in ("status", "statut", "draft", "brouillon", "validated", "valide", "refused", "refuse")):
            return (
                "Procedures have three statuses: draft, validated, and refused. Drafts can be edited by their creator, validated procedures are locked, and refused procedures can be corrected and resubmitted."
            )

        if any(term in normalized for term in ("version", "revision", "historique", "history", "date", "category", "categorie", "filter", "filtre", "search", "rechercher")):
            return (
                "Procedures can be browsed by category and ordered by newest or oldest creation date. "
                "Draft edits increase the version automatically unless an administrator sets a version manually. Use the procedure details and history pages to review available information."
            )

        if any(term in normalized for term in ("chat", "message", "conversation", "support", "assistant", "historique des messages")):
            return (
                "Support shows your latest messages from today so you can ask a new question quickly. "
                "Chat History keeps the complete conversation and lets you filter messages by day."
            )

        if any(term in normalized for term in ("admin", "administrator", "administrateur", "permission", "role", "droit")):
            return (
                "Administrators can manage users, categories, procedures, documents, and chat logs. Standard users can manage their own profile, drafts, documents allowed by the procedure rules, and personal conversations."
            )

        if any(term in normalized for term in ("dashboard", "home", "accueil")):
            return "The dashboard is your starting page for platform activity. Use the sidebar to open procedures, support, chat history, profile, or settings."

        if any(term in normalized for term in ("profile", "profil", "settings", "parametre")):
            return "Profile contains your account information. Settings is where you can update available account preferences and password fields."

        if any(term in normalized for term in ("help", "question", "what can you", "que peux-tu", "bonjour", "hello")):
            return (
                "I can explain account access, procedures, categories, drafts, validation, refusal, versions, documents, permissions, the dashboard, profile, settings, support, and day-filtered chat history."
            )

        return "I can answer questions about this platform's accounts, procedures, documents, approvals, permissions, dashboard, profile, settings, support, and chat history."

    def post(self, request, *args, **kwargs):
        contenu_message = request.data.get('contenu_message', '')
        normalized_message = ''.join(
            character for character in unicodedata.normalize('NFKD', contenu_message or '')
            if not unicodedata.combining(character)
        ).strip().lower()
        is_french = any(term in normalized_message for term in (
            "bonjour", "comment", "je veux", "mot de passe", "compte", "procedure", "document",
            "administrateur", "historique", "connexion", "inscription", "aide", "brouillon",
        ))

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
                                f"Answer user questions directly, clearly, and politely. {'Answer in French because the user wrote in French.' if is_french else 'Answer in the user\'s language when possible.'} "
                                "The platform has Login and Sign up, a Dashboard, Procedures, Support, Chat History, Profile, Settings, and administrator pages for users, procedures, and chat logs. "
                                "Procedures have draft, validated, and refused statuses; creators can edit drafts, validated procedures are normally locked, and administrators review submissions. "
                                "Documents support PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, ODT, and ODS files. Procedures can be filtered by category and ordered by creation date. "
                                "Support shows only the latest same-day messages for quick access, while Chat History contains the complete conversation and supports filtering by day. "
                                "Never invent a feature or promise an action the platform does not provide. If the user asks about something outside this platform, explain that you only support platform-related topics."
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
