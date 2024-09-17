import datetime

from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.hashers import make_password
from django.forms.widgets import PasswordInput, TextInput
from django.utils.translation import gettext as _
from core.backend.validators import (
    CheckPasswordPolicy,
    CheckUsernameAlreadyUsed,
)
from core.models import User


class UploadImageForm(forms.Form):

    CATEGORIES = (
        ("BACKGROUND", "background"),
        ("FOREGROUND", "foreground"),
    )

    TYPES = (
        ("PLANET", "planet"),
        ("ASTEROID", "asteroid"),
        ("STATION", "station"),
        ("SATELLITE", "satellite"),
        ("STAR", "star"),
        ("BLACKHOLE", "blackhole"),
    )

    img_input = forms.ImageField(label="image_url", required=True)
    category = forms.ChoiceField(choices=CATEGORIES, required=True)
    type = forms.ChoiceField(choices=TYPES, required=False)
    file_directory_name = forms.CharField(
        label="name directory were this map will be saved", required=True
    )


class LoginForm(AuthenticationForm):
    """docstring"""

    username = forms.CharField(
        widget=TextInput(
            attrs={
                "label": _("Username"),
                "class": "",
                "placeholder": f"{_('Username')}...",
            }
        ),
        required=True,
    )
    password = forms.CharField(
        widget=PasswordInput(
            attrs={
                "label": _("password"),
                "class": "",
                "placeholder": f"{_('password')}...",
            }
        ),
        required=True,
    )


class SignupForm(forms.ModelForm):
    """docstring"""

    class Meta:
        model = User
        fields = ["username", "password"]
        exclude = ["user_id"]

    def save(self, *args, **kwargs):
        self.instance.username = self.instance.username.lower()
        self.instance.password = make_password(self.instance.password)
        self.instance.is_staff = False
        self.instance.is_active = True
        self.instance.date_joined = datetime.datetime.now()
        super().save()

    username = forms.CharField(
        widget=TextInput(
            attrs={
                "class": "form-control text-center",
                "placeholder": _("Username"),
            }
        ),
        required=True,
        label="",
        validators=[CheckUsernameAlreadyUsed().validate],
        help_text=CheckUsernameAlreadyUsed().get_help_text(),
    )
    email = forms.EmailField(
        widget=TextInput(
            attrs={
                "class": "form-control text-center",
                "placeholder": _("Email"),
            }
        )
    )
    password = forms.CharField(
        widget=PasswordInput(
            attrs={
                "class": "form-control mt-1 text-center",
                "placeholder": _("Password"),
            }
        ),
        required=True,
        label="",
        validators=[CheckPasswordPolicy().validate],
    )
    password2 = forms.CharField(
        widget=PasswordInput(
            attrs={
                "class": "form-control mt-1 text-center",
                "placeholder": _("Confirm password"),
            },
        ),
        required=True,
        label="",
        validators=[CheckPasswordPolicy().validate],
        help_text=CheckPasswordPolicy().get_help_text(),
    )
