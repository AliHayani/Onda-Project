from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('procedures', '0005_alter_document_fichier'),
    ]

    operations = [
        migrations.AddField(
            model_name='procedure',
            name='date_creation',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
