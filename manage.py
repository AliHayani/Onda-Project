#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path


def _ensure_local_vendor():
    """
    Ajoute le dossier local .vendor/ en tête de sys.path seulement si
    l'environnement explicite son usage. Cela évite d'importer des dépendances
    vendues incompatibles avec l'interpréteur Python actuel.
    """
    vendor_dir = Path(__file__).resolve().parent / ".vendor"
    if not vendor_dir.exists():
        return

    use_vendor = os.environ.get("ONDA_USE_VENDOR", "").lower() in {"1", "true", "yes"}
    if use_vendor:
        sys.path.insert(0, str(vendor_dir))


def main():
    """Run administrative tasks."""
    _ensure_local_vendor()
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'onda_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
