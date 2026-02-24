from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recorp.settings')

app = Celery('recorp', include=["core.tasks"])

# Configure Celery using settings from Django settings.py.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load tasks from Django apps + explicit import fallback for reliability.
# In this project we rely on `core.tasks` for gameplay timers (respawn/wreck expiry),
# so we register it explicitly to avoid silent autodiscovery misses.
app.autodiscover_tasks()
app.conf.imports = tuple(set(getattr(app.conf, "imports", ()) + ("core.tasks",)))
