import os

import django
django.setup()

from channels.routing import get_default_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recorp.settings')


application = get_default_application()

