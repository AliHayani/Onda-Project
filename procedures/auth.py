from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import UtilisateurSerializer

Utilisateur = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = Utilisateur.USERNAME_FIELD

    def validate(self, attrs):
        username = attrs.get(self.username_field)
        password = attrs.get('password')

        if not username or not password:
            raise serializers.ValidationError('Username and password are required.')

        self.user = authenticate(self.context.get('request'), username=username, password=password)

        if self.user is None:
            try:
                user_with_email = Utilisateur.objects.get(email=username)
                self.user = authenticate(self.context.get('request'), username=user_with_email.username, password=password)
                if self.user is not None:
                    attrs[self.username_field] = self.user.username
            except Utilisateur.DoesNotExist:
                self.user = None

        if self.user is None:
            raise serializers.ValidationError('No active account found with the given credentials')

        data = super().validate(attrs)
        data['user'] = UtilisateurSerializer(self.user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
