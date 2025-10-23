import os
from pathlib import Path
import environ
from django.utils.translation import gettext_lazy as _
import mimetypes

BASE_DIR = Path(__file__).resolve().parent.parent

# Initialise environment variables
env = environ.Env(
    # set casting, default value
    DEBUG=(bool, False)
)
environ.Env.read_env()

# os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

SECRET_KEY = "django-insecure-%r)c^utworo7x81)a9=-4^@x$b$aizu1#^wa_^sf9u=u4jb^*@"

LOGIN_REDIRECT_URL = "/"
DEBUG = True

ALLOWED_HOSTS = ["127.0.0.1", "3799-90-91-227-84.ngrok-free.app"]

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
]

MIDDLEWARE = [
    "django.middleware.cache.UpdateCacheMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "core.middleware.WebSocketSessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # "django.middleware.cache.FetchFromCacheMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django_user_agents.middleware.UserAgentMiddleware",
    "core.middleware.OneSessionPerUserMiddleware",
    "django.middleware.locale.LocaleMiddleware"
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
    "https://3799-90-91-227-84.ngrok-free.app",
]

WSGI_APPLICATION = "recorp.routing.application"
ASGI_APPLICATION = "recorp.routing.application"

ASGI_APPLICATION_CLOSE_TIMEOUT = 30

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Configuration session
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7  # 1 semaine
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = False  # ⚠️ Désactiver pour WebSocket
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Timeout session plus long pour WebSocket
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7  # 7 jours

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



# Configuration Celery pour éviter les timeouts
CELERY_BROKER_URL = 'redis://127.0.0.1:6379/1'
CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/1'
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BROKER_TRANSPORT_OPTIONS = {
    'visibility_timeout': 3600,
    'fanout_prefix': True,
    'fanout_patterns': True,
    'socket_keepalive': True,
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
TIME_ZONE = "UTC"

LANGUAGE_CODE = "en-US"
USE_I18N = True
LANGUAGES = [
    ("fr", _("French")),
    ("en", _("English")),
]
LOCALE_PATHS = [os.path.join(BASE_DIR, "locale")]

# private
# Static files are usually either part of your code,
# or part of your dependencies’ code.
# They can come from various places, each app may provide its own files.
# They are typically kept in source control.
# The Django admin ships with some javascript and CSS,
# for example, that are stored in Django’s Github repository.
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

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "file": {
            "level": "DEBUG",
            "class": "logging.FileHandler",
            "filename": f'{os.path.join(BASE_DIR, "recorp", "logs") + "debug.logs"}',
        },
    },
    "loggers": {
        "django": {
            "handlers": ["file"],
            "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": True,
        },
    },
}
