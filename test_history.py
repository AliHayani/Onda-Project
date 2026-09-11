import requests

print("Tentative de connexion pour lire l'historique...")
login_response = requests.post('http://127.0.0.1:8000/api/token/', data={
    'username': 'youssef', 
    'password': '12345' 
})

if login_response.status_code == 200:
    token = login_response.json().get('access')
    print("✅ Connexion réussie !\n")
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    print("Récupération de l'historique depuis la base de données...")
    # On fait un GET cette fois-ci, pas un POST
    history_response = requests.get('http://127.0.0.1:8000/api/chat/', headers=headers)
    
    if history_response.status_code == 200:
        print("\n📚 Historique complet des messages :")
        messages = history_response.json()
        for msg in messages:
            print(f"👤 Toi : {msg.get('contenu_message')}")
            print(f"🤖 IA  : {msg.get('reponse_bot')}\n")
    else:
        print(f"❌ Erreur : {history_response.status_code}")
        print(history_response.text)
else:
    print("❌ Erreur de connexion (Mauvais identifiants ou serveur éteint)")
