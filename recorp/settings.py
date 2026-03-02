import os
from pathlib import Path
from datetime import timedelta
import environ
from django.utils.translation import gettext_lazy as _
import mimetypes
import logging

BASE_DIR = Path(__file__).resolve().parent.parent

# Initialise environment variables
env = environ.Env(
    # set casting, default value
    DEBUG=(bool, False)
)
environ.Env.read_env()

# os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

SECRET_KEY = env("SECRET_KEY")

LOGIN_REDIRECT_URL = "/"
DEBUG = env("DEBUG")

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",          # accept the common local name
    "localhost:8000",     # include port when present
    "[::1]",              # IPv6 loopback
    "https://6b4e7f2ebb00.ngrok-free.app",
    "6b4e7f2ebb00.ngrok-free.app",
    "testserver",  # added for Django test client
    # for development you can also use a wildcard: "*"
]

INSTALLED_APPS = [
    "daphne",
    "core.apps.CustomAdminConfig",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "channels",
    "django_redis",
    "recorp",
    "core.apps.CoreConfig",
    "django_user_agents",
    "axes",
]

MIDDLEWARE = [
    "django.middleware.cache.UpdateCacheMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "core.middleware.WebSocketSessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "core.middleware.Redirect404ToIndexMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "axes.middleware.AxesMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # "django.middleware.cache.FetchFromCacheMiddleware",
    # locale middleware should appear once after MessageMiddleware
    "django.middleware.locale.LocaleMiddleware",
    "django_user_agents.middleware.UserAgentMiddleware",
    "core.middleware.OneSessionPerUserMiddleware",
]

ROOT_URLCONF = "recorp.urls"

INTERNAL_IPS = [
    "127.0.0.1",
]

MESSAGE_STORAGE = "django.contrib.messages.storage.session.SessionStorage"

TAILWIND_APP_NAME = "theme"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            os.path.join(f"{BASE_DIR}", "core", "templates", "core"),
            os.path.join(f"{BASE_DIR}", "core", "templates", "core", "game_elements"),
            os.path.join(
                f"{BASE_DIR}", "core", "templates", "core", "game_elements", "panels"
            ),
            os.path.join(
                f"{BASE_DIR}", "core", "templates", "core", "game_elements", "modals"
            ),
            os.path.join(
                f"{BASE_DIR}", "core", "templates", "core", "game_elements", "game"
            ),
            os.path.join(f"{BASE_DIR}", "core", "templates", "core", "index"),
            os.path.join(f"{BASE_DIR}", "core", "templates", "core", "admin"),
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
            "libraries": {
                "customtags": "core.templatetags.customtags",
            },
        },
    },
]

# Traite l'erreur MIME TYPE de JS.
mimetypes.add_type("application/javascript", ".js", True)

CSRF_TRUSTED_ORIGINS = [
    "https://www.recorp.com",
    "https://6b4e7f2ebb00.ngrok-free.app",
]

WSGI_APPLICATION = "recorp.routing.application"
ASGI_APPLICATION = "recorp.routing.application"

ASGI_APPLICATION_CLOSE_TIMEOUT = 30

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Configuration session
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7  # 1 semaine
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = True  # âœ… ForcÃ© pour CSRF token valide
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Timeout session plus long pour WebSocket
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7  # 7 jours

# ========================================
# Authentication Backends
# ========================================
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
            "capacity": 1500,  # Maximum number of messages to store
            "expiry": 60,      # Message expiry in seconds
            "group_expiry": 86400,  # Group expiry in seconds (24h)
            "symmetric_encryption_keys": [SECRET_KEY],
        },
    },
}

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {
                "socket_keepalive": True,
                "socket_keepalive_options": {},
                "health_check_interval": 30,
                "socket_connect_timeout": 5,
                "socket_timeout": 5, 
            }
        },
        "KEY_PREFIX": "recorp_game",
        "TIMEOUT": 60 * 60 * 24,
    }
}

# WebSocket settings
WEBSOCKET_ACCEPT_ALL = True
WEBSOCKET_TIMEOUT = 30

# Configuration Celery pour Ã©viter les timeouts
CELERY_BROKER_URL = 'redis://127.0.0.1:6379/1'
CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/1'
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BROKER_TRANSPORT_OPTIONS = {
    'visibility_timeout': 3600,
    'fanout_prefix': True,
    'fanout_patterns': True,
    'socket_keepalive': True,
}

# Tick global gameplay (remplace progressivement les traitements "lazy" cÃ´tÃ© WS).
CELERY_BEAT_SCHEDULE = {
    "game-world-tick-2s": {
        "task": "core.tasks.game_world_tick",
        "schedule": 2.0,
    },
}

USER_AGENTS_CACHE = "default"

CACHE_MIDDLEWARE_ALIAS = "default"
CACHE_MIDDLEWARE_SECONDS = 60 * 60
CACHE_MIDDLEWARE_KEY_PREFIX = ""

# Don't forget to create ODBC db user in your database gestion soft (i use heidiSQL)
DATABASES = {
    "default": {
        "ENGINE": "mysql.connector.django",
        "NAME": os.getenv("SQL_DBNAME"),
        "USER": os.getenv("SQL_USER"),
        "PASSWORD": os.getenv("SQL_PASSWORD"),
        "HOST": os.getenv("SQL_HOST"),
        "PORT": os.getenv("SQL_PORT"),
        "character-set": 'utf8mb4',
    }
}

# AUTH_USER_MODEL = "core.Users"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

USE_TZ = True
TIME_ZONE = "Europe/Paris"

LANGUAGE_CODE = "en-US"
USE_I18N = True
LANGUAGES = [
    ("fr", _("French")),
    ("en", _("English")),
]
LOCALE_PATHS = [os.path.join(BASE_DIR, "locale")]

# private
# Static files are usually either part of your code,
# or part of your dependenciesâ€™ code.
# They can come from various places, each app may provide its own files.
# They are typically kept in source control.
# The Django admin ships with some javascript and CSS,
# for example, that are stored in Djangoâ€™s Github repository.
STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "recorp", "static")

STATICFILES_DIRS = [
    ("tailwind", os.path.join(BASE_DIR, "recorp", "static", "js", "tailwind")),
    ("img", os.path.join(BASE_DIR, "recorp", "static", "img")),
    ("ux", os.path.join(BASE_DIR, "recorp", "static", "img", "ux")),
    (
        "world_builder",
        os.path.join(BASE_DIR, "recorp", "static", "js", "game", "world_builder"),
    ),
    (
        "ships",
        os.path.join(BASE_DIR, "recorp", "static", "img", "foreground", "ships"),
    ),
    (
        "planet",
        os.path.join(BASE_DIR, "recorp", "static", "img", "foreground", "planet"),
    ),
    (
        "station",
        os.path.join(BASE_DIR, "recorp", "static", "img", "foreground", "station"),
    ),
    (
        "asteroid",
        os.path.join(BASE_DIR, "recorp", "static", "img", "foreground", "asteroid"),
    ),
    (
        "satellite",
        os.path.join(
            BASE_DIR, "recorp", "static", "img", "foreground", "satellite"
        ),
    ),
    (
        "star",
        os.path.join(BASE_DIR, "recorp", "static", "img", "foreground", "star"),
    ),
    (
        "blackhole",
        os.path.join(
            BASE_DIR, "recorp", "static", "img", "foreground", "blackhole"
        ),
    ),
    (
        "fontawesome", 
        os.path.join(
            BASE_DIR, "recorp", "static", "js", "fontawesome"
        )
    ),
    (
        "floating_icon", 
        os.path.join(
            BASE_DIR, "recorp", "static", "img", "floating_icon"
        )
        
    )
]

# public
# Media files are usually for files
# which are uploaded
# by users or generated by your application during the life of your Django project.
# They are typically not stored in source control.
MEDIA_URL = "media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Filtre personnalisÃ© pour exclure les requÃªtes statiques 200 OK
class SkipStaticFilesFilter(logging.Filter):
    """
    Filtre qui exclut les logs des requÃªtes GET sur fichiers statiques 
    avec rÃ©ponse 200 (succÃ¨s). Garde les erreurs (4xx, 5xx).
    """
    def filter(self, record):
        # Exclure les requÃªtes GET sur fichiers statiques qui reviennent 200
        if hasattr(record, 'status_code'):
            # Si c'est une requÃªte qui revient 200
            if record.status_code == 200:
                # VÃ©rifie si c'est une requÃªte statique (JS, CSS, images, fonts)
                message = record.getMessage()
                static_extensions = (
                    '/static/', '/media/',
                    '.js', '.css', '.png', '.gif', '.jpg', '.jpeg', '.webp',
                    '.woff2', '.woff', '.ttf', '.svg', '.json'
                )
                if any(ext in message for ext in static_extensions):
                    return False  # Exclure ce log
        
        # Garder tout le reste (erreurs 4xx, 5xx, WebSocket, requÃªtes API, etc.)
        return True


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{levelname}] {asctime} | {name} | {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "simple": {
            "format": "{levelname}: {message}",
            "style": "{",
        },
    },
    "filters": {
        "skip_static": {
            "()": SkipStaticFilesFilter,
        },
    },
    "handlers": {
        "file_errors": {
            "level": "WARNING",
            "class": "logging.FileHandler",
            "filename": os.path.join(BASE_DIR, "recorp", "logs", "errors.logs"),
            "formatter": "verbose",
            "filters": ["skip_static"],
        },
        "file_security": {
            "level": "WARNING",
            "class": "logging.FileHandler",
            "filename": os.path.join(BASE_DIR, "recorp", "logs", "security.logs"),
            "formatter": "verbose",
        },
        "console": {
            "level": "WARNING",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["file_errors"],
            "level": os.getenv("DJANGO_LOG_LEVEL", "WARNING"),
            "propagate": False,
        },
        "django.request": {
            "handlers": ["file_errors"],
            "level": "WARNING",
            "propagate": False,
        },
        "core": {
            "handlers": ["console", "file_errors"],
            "level": "WARNING",
            "propagate": False,
        },
        "core.backend": {
            "handlers": ["console", "file_errors"],
            "level": "WARNING",
            "propagate": False,
        },
        "security": {
            "handlers": ["file_security"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# ========================================
# Django-Axes Configuration (Rate Limiting)
# ========================================
AXES_FAILURE_LIMIT = 5  # 5 tentatives max
AXES_COOLOFF_TIME = timedelta(minutes=15)  # Deblocage auto apres 15 minutes
AXES_LOCK_OUT_AT_FAILURE = True  # Bloquer aprÃ¨s N tentatives
AXES_USE_CACHE = 'default'  # Utiliser Redis pour plus de vitesse
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_CALLABLE = "core.backend.auth_lockout.axes_lockout_response"

