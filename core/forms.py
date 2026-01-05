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
    CheckCharacterNameAlreadyUsed,
    CheckImageExtension,
)
from core.models import User, Player, Archetype, SkillExperience


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
    
    
class CreateCharacterForm(forms.ModelForm):
    """docstring"""
    
    class Meta:
        model = Player
        fields = ["name", "description", "image", "faction", "archetype"]
        exclude = ["user_id"]
        
    
    name = forms.CharField(
        widget=TextInput(
            attrs={
                "class": "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
        ),
        required=True,
        label=_("name"),
        validators=[CheckCharacterNameAlreadyUsed().validate],
        help_text=CheckCharacterNameAlreadyUsed().get_help_text(),
    )
    
    archetype = forms.ModelChoiceField(queryset=Archetype.objects.all())

    description = forms.CharField(
        widget=forms.Textarea(
            attrs={
                "rows":"5",
                "placeholder": _("Your character's description here...")
            },
        ),
        label=_("description"),
        required=False,
    )
    
    image = forms.ImageField(
        label="image_url", 
        required=False,
        validators=[CheckImageExtension().validate],
        help_text=CheckImageExtension().get_help_text(),
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


class SetXpForm(forms.ModelForm):
    """docstring"""

    class Meta:
        model = SkillExperience
        fields = ["required_experience"]

    def save(self, *args, **kwargs):
        for i in range(0,100):
            self.instance.level = i
            self.instance.required_experience = int(self.instance.required_experience)
            super().save()
            
PRESET_CHOICES = [
    ("", "— Taille personnalisée —"),
    ("32x32", "w-32 × h-32 (vaisseau leger - asteroid)"),
    ("64x32", "w-64 × h-32 (vaisseau medium)"),
    ("96x64", "w-96 × h-64 (vaisseau lourd)"),
    ("96x96", "w-96 × h-96 (vaisseau super lourd)"),
    ("64x64", "w-64 × h-64 (étoile)"),
    ("64x96", "w-64 × h-96 (warpzone)"),
    ("96x96", "w-96 × h-96 (satellite)"),
    ("96x128", "w-96 × h-128 (station)"),
    ("128x128", "w-128 × h-128 (planete)"),
]

class AdminImageResizeForm(forms.Form):
    image = forms.ImageField(label="Image PNG")

    preset = forms.ChoiceField(
        label="Preset de résolution",
        choices=PRESET_CHOICES,
        required=False
    )
    
    width = forms.IntegerField(label="Largeur X (px)", min_value=32, required=False)
    height = forms.IntegerField(label="Hauteur Y (px)", min_value=32, required=False)

    use_contain = forms.BooleanField(
        label="Conserver le ratio (mode contain)",
        required=False,
        initial=True
    )

    rotate = forms.BooleanField(
        label="Pivoter l’image ?",
        required=False
    )

    rotation_angle = forms.IntegerField(
        label="Angle de rotation (°)",
        required=False,
        initial=0
    )

    def clean(self):
        
        cleaned = super().clean()

        preset = cleaned.get("preset")
        width = cleaned.get("width")
        height = cleaned.get("height")
        rotate = cleaned.get("rotate")
        rotation_angle = cleaned.get("rotation_angle")

        # 🎯 gestion du preset
        if preset:
            w, h = preset.split("x")
            cleaned["width"] = int(w)
            cleaned["height"] = int(h)
            cleaned["preset"] = preset
            cleaned["rotate"] = rotate
            cleaned["rotation_angle"] = rotation_angle
        else:
            if not width or not height:
                raise forms.ValidationError(
                    "Veuillez renseigner une largeur et une hauteur ou choisir un preset."
                )

        # 🔁 validation rotation
        if rotate and rotation_angle is None:
            raise forms.ValidationError(
                "Veuillez préciser un angle de rotation"
            )

        return cleaned
    