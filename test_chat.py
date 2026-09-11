import requests

print("Tentative de connexion...")
login_response = requests.post('http://127.0.0.1:8000/api/token/', data={
    'username': 'youssef', 
    'password': '12345' 
})

if login_response.status_code == 200:
    token = login_response.json().get('access')
    print("✅ Connexion réussie ! Token récupéré.\n")
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    data = {
        'contenu_message': 'Bonjour Gemini, donne-moi une définition très courte de ce qu\'est une adresse IP.'
    }
    
    print("Envoi du message à l'IA...")
    chat_response = requests.post('http://127.0.0.1:8000/api/chat/', headers=headers, json=data)
    
    if chat_response.status_code == 200:
        print("\n🤖 Réponse du Bot :")
        print(chat_response.json())
    else:
        print(f"❌ Erreur du Chatbot : {chat_response.status_code}")
        print(chat_response.text)
else:
    print("❌ Erreur de connexion (Mauvais identifiants ou serveur éteint)")
