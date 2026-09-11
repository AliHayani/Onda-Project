# Generated manually because Python is not available in this shell.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("procedures", "0003_alter_procedure_version"),
    ]

    operations = [
        migrations.AddField(
            model_name="procedure",
            name="createur",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="procedures_creees",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
