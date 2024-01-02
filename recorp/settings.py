import os
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

# Initialise environment variables
env = environ.Env(
    # set casting, default value
    DEBUG=(bool, False)
)
environ.Env.read_env()

SECRET_KEY = "django-insecure-%r)c^utworo7x81)a9=-4^@x$b$aizu1#^wa_^sf9u=u4jb^*@"

DEBUG = True

ALLOWED_HOSTS = ["127.0.0.1", "16df-90-127-107-214.ngrok-free.app"]

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "channels",
    "django_redis",
    "recorp",
    "core",
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
    #"django.middleware.cache.FetchFromCacheMiddleware",
    "django.middleware.locale.LocaleMiddleware",
]

ROOT_URLCONF = "recorp.urls"

INTERNAL_IPS = [
    "127.0.0.1",
]

TAILWIND_APP_NAME = 'theme'

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            os.path.join(f"{BASE_DIR}", "core", "templates", "core"),
            os.path.join(f"{BASE_DIR}", "core", "templates", "core", "game_elements"),
            os.path.join(f"{BASE_DIR}", "core", "templates", "core", "game_elements", "panels"),
            os.path.join(f"{BASE_DIR}", "core", "templates", "core", "game_elements", "modals"),
            os.path.join(f"{BASE_DIR}", "core", "templates", "core", "game_elements", "game"),
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

CSRF_TRUSTED_ORIGINS = ["https://www.recorp.com"]

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
    }
}

CACHE_MIDDLEWARE_ALIAS = "default"
CACHE_MIDDLEWARE_SECONDS = 60 * 60
CACHE_MIDDLEWARE_KEY_PREFIX = ""

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("PSQL_NAME"),
        "USER": os.getenv("PSQL_USER"),
        "PASSWORD": os.getenv("PSQL_PASSWORD"),
        "HOST": "localhost",
        "PORT": os.getenv("PSQL_PORT"),
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

LANGUAGE_CODE = 'en-US'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
LANGUAGES = [
    ('es', 'Spanish'),
    ('fr', 'French'),
    ('en', 'English'),
]
LOCALE_PATHS = [os.path.join(BASE_DIR, 'locale')]

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
    ("world_builder", os.path.join(BASE_DIR, "recorp", "static", "js", "game", "world_builder")),
    ("ships", os.path.join(BASE_DIR, "recorp", "static", "js", "game", "assets", "ships")),
    ("planets", os.path.join(BASE_DIR, "recorp", "static", "js", "game", "assets", "planets")),
    ("stations", os.path.join(BASE_DIR, "recorp", "static", "js", "game", "assets", "stations")),
    ("default_img", os.path.join(BASE_DIR, "recorp", "static", "js", "game", "assets", "default_img")),
    ("fontawesome", os.path.join(BASE_DIR, "recorp", "static", "js", "fontawesome")),
    ("ckeditor", os.path.join(BASE_DIR, "recorp", "static", "js", "ckeditor5"))
]

# public
# Media files are usually for files
# which are uploaded
# by users or generated by your application during the life of your Django project.
# They are typically not stored in source control.
MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': f'{os.path.join(BASE_DIR, "recorp", "logs") + "debug.logs"}',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': True,
        },
    },
}
