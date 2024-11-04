import os
from pathlib import Path
import environ
from django.utils.translation import gettext_lazy as _

BASE_DIR = Path(__file__).resolve().parent.parent

# Initialise environment variables
env = environ.Env(
    # set casting, default value
    DEBUG=(bool, False)
)
environ.Env.read_env()

SECRET_KEY = "django-insecure-%r)c^utworo7x81)a9=-4^@x$b$aizu1#^wa_^sf9u=u4jb^*@"

LOGIN_REDIRECT_URL = "/"
DEBUG = True

ALLOWED_HOSTS = ["127.0.0.1", "0537-82-124-180-128.ngrok-free.app"]

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
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # "django.middleware.cache.FetchFromCacheMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django_user_agents.middleware.UserAgentMiddleware",
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

CSRF_TRUSTED_ORIGINS = [
    "https://www.recorp.com",
    "https://0537-82-124-180-128.ngrok-free.app",
]

WSGI_APPLICATION = "recorp.routing.application"
ASGI_APPLICATION = "recorp.routing.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        "KEY_PREFIX": "recorp_game",
        "TIMEOUT": None,
    }
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
        "default-character-set": os.getenv("SQL_CHARSET"),
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
    ("es", _("Spanish")),
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

STATICFILES_DIRS = [
    ("tailwind", os.path.join(BASE_DIR, "recorp", "static", "js", "tailwind")),
    ("img", os.path.join(BASE_DIR, "recorp", "static", "img")),
    ("ux", os.path.join(BASE_DIR, "recorp", "static", "js", "game", "assets", "ux")),
    (
        "world_builder",
        os.path.join(BASE_DIR, "recorp", "static", "js", "game", "world_builder"),
    ),
    (
        "ships",
        os.path.join(BASE_DIR, "recorp", "static", "js", "game", "assets", "ships"),
    ),
    (
        "planets",
        os.path.join(BASE_DIR, "recorp", "static", "js", "game", "assets", "planets"),
    ),
    (
        "stations",
        os.path.join(BASE_DIR, "recorp", "static", "js", "game", "assets", "stations"),
    ),
    (
        "stations",
        os.path.join(BASE_DIR, "recorp", "static", "js", "game", "assets", "asteroids"),
    ),
    (
        "asteroids",
        os.path.join(
            BASE_DIR, "recorp", "static", "js", "game", "assets", "satellites"
        ),
    ),
    (
        "stars",
        os.path.join(BASE_DIR, "recorp", "static", "js", "game", "assets", "stars"),
    ),
    (
        "blackholes",
        os.path.join(
            BASE_DIR, "recorp", "static", "js", "game", "assets", "blackholes"
        ),
    ),
    ("fontawesome", os.path.join(BASE_DIR, "recorp", "static", "js", "fontawesome")),
    ("ckeditor", os.path.join(BASE_DIR, "recorp", "static", "js", "ckeditor5")),
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
