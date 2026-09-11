from django.db import migrations


def create_default_categories(apps, schema_editor):
    Categorie = apps.get_model('procedures', 'Categorie')
    default_categories = [
        {
            'nom': 'Infrastructure et réseaux',
            'description': 'Réseaux, serveurs, pare-feu, et infrastructure technique.',
            'service_associe': 'Service Réseaux et Infrastructure',
        },
        {
            'nom': 'Systèmes d’exploitation aéroportuaire',
            'description': 'Systèmes métiers liés à l’exploitation des terminaux et du plateau.',
            'service_associe': 'Service Exploitation et Systèmes',
        },
        {
            'nom': 'Applications passagers',
            'description': 'Services et applications destinés aux passagers.',
            'service_associe': 'Service Expérience Passager',
        },
        {
            'nom': 'Sécurité et cybersécurité',
            'description': 'Sécurité des systèmes et des données.',
            'service_associe': 'Service Sécurité Informatique',
        },
        {
            'nom': 'Données et analytique',
            'description': 'Tableaux de bord, rapports et exploitation des données.',
            'service_associe': 'Service Data & BI',
        },
        {
            'nom': 'Support IT / helpdesk',
            'description': 'Support utilisateur et assistance technique.',
            'service_associe': 'Service Support Utilisateur',
        },
        {
            'nom': 'Conformité et gouvernance',
            'description': 'Règles, audits, conformité et bonnes pratiques.',
            'service_associe': 'Service Gouvernance et Qualité',
        },
        {
            'nom': 'Projets et gestion du changement',
            'description': 'Pilotage de projets et accompagnement du changement.',
            'service_associe': 'Service Gestion de Projet',
        },
        {
            'nom': 'Télécoms et communications',
            'description': 'Réseau voix, data et communications aéroportuaires.',
            'service_associe': 'Service Télécommunications',
        },
        {
            'nom': 'Maintenance et supervision',
            'description': 'Supervision, maintenance et monitoring opérationnel.',
            'service_associe': 'Service Opérations et Supervision',
        },
    ]

    for category in default_categories:
        Categorie.objects.get_or_create(nom=category['nom'], defaults=category)


class Migration(migrations.Migration):

    dependencies = [
        ('procedures', '0006_procedure_date_creation'),
    ]

    operations = [
        migrations.RunPython(create_default_categories),
    ]
