# Generated manually because the local shell does not expose the project Python directly.

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("procedures", "0004_procedure_createur"),
    ]

    operations = [
        migrations.AlterField(
            model_name="document",
            name="fichier",
            field=models.FileField(
                upload_to="procedures/documents/",
                validators=[
                    django.core.validators.FileExtensionValidator(
                        allowed_extensions=["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "odt", "ods"]
                    )
                ],
            ),
        ),
    ]
