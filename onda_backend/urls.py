"""
URL configuration for onda_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from procedures.auth import CustomTokenObtainPairView
from procedures.views import (
    AdminChatLogsAPIView,
    AdminChatUsersAPIView,
    ChatSessionListAPIView,
    ChatbotAPIView,
    home,
)

urlpatterns = [
    path('', home, name='root-home'),
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/chat/', ChatbotAPIView.as_view(), name='chatbot_api'),
    path('api/chat/sessions/', ChatSessionListAPIView.as_view(), name='chat_session_list_api'),
    path('api/chat/sessions/<int:session_id>/', ChatSessionListAPIView.as_view(), name='chat_session_detail_api'),
    path('api/admin/chat-users/', AdminChatUsersAPIView.as_view(), name='admin_chat_users_api'),
    path('api/admin/chat-logs/', AdminChatLogsAPIView.as_view(), name='admin_chat_logs_api'),
    path('api/', include('procedures.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
