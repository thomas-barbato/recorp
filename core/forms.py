import datetime

from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.hashers import make_password
from django.forms.widgets import PasswordInput, TextInput
from django.utils.translation import gettext as _
from core.backend.validators import (
    CheckPasswordPolicy,
    CheckPassword2Policy,
    CheckUsernameAlreadyUsed,
    CheckEmailAlreadyUsed,
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
        ("WARPZONE", "warpzone"),
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
        fields = ["first_name", "last_name", "username", "password", "email"]
        exclude = ["user_id"]

    def save(self, *args, **kwargs):
        self.instance.username = self.instance.username.lower()
        self.instance.password = make_password(self.instance.password)
        self.instance.email = self.instance.email.lower()
        self.instance.first_name = self.instance.first_name.lower() if self.instance.first_name else "None"
        self.instance.last_name = self.instance.last_name.lower() if self.instance.last_name else "None"
        self.instance.is_staff = False
        self.instance.is_active = True
        self.instance.date_joined = datetime.datetime.now()
        super().save()
    
    first_name= forms.CharField(
        widget=TextInput(
            attrs={
                "class": "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
                "placeholder": "Jonh",
            }
        ),
        required=False,
        label=_("first name"),
    )
    
    last_name= forms.CharField(
        widget=TextInput(
            attrs={
                "class": "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
        ),
        required=False,
        label=_("last name"),
    )  
    
    username = forms.CharField(
        widget=TextInput(
            attrs={
                "class": "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
        ),
        required=True,
        label=_("username"),
        validators=[CheckUsernameAlreadyUsed().validate],
        help_text=CheckUsernameAlreadyUsed().get_help_text(),
    )
    email = forms.EmailField(
        widget=TextInput(
            attrs={
                "class": "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
        ),
        required=True,
        label=_("email address"),
        validators=[CheckEmailAlreadyUsed().validate],
        help_text=CheckEmailAlreadyUsed().get_help_text(),
    )
    password = forms.CharField(
        widget=PasswordInput(
            attrs={
                "class": "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
        ),
        required=True,
        label=_("password"),
        validators=[CheckPasswordPolicy().validate],
        help_text=CheckPasswordPolicy().get_help_text(),
    )
    password2 = forms.CharField(
        widget=PasswordInput(
            attrs={
                "class": "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            },
        ),
        required=True,
        label=_("confirm password"),
        help_text=CheckPassword2Policy().get_help_text(),
    )

class PasswordRecoveryForm(forms.ModelForm):
    """docstring"""

    class Meta:
        model = User
        fields = ["email"]
        
    email = forms.EmailField(
        widget=TextInput(
            attrs={
                "class": "form-control text-center",
                "placeholder": _("Email"),
            }
        ),
        required=True,
        validators=[CheckPasswordPolicy().validate],
    )