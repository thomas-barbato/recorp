"""import """

import re
from pathlib import Path

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils.safestring import mark_safe
from django.utils.translation import gettext as _


class CheckPasswordPolicy:
    """docstring"""

    def __init__(self):
        self.password_pattern = (
            "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$"
        )

    def validate(self, password):
        """
        Has minimum 8 characters in length
        At least one uppercase letter. You can remove this condition by removing (?=.*?[A-Z])
        At least one lowercase letter. You can remove this condition by removing (?=.*?[a-z])
        At least one digit. You can remove this condition by removing (?=.*?[0-9])
        At least one special character, You can remove this condition by removing (?=.*?[#?!@$%^&*-])
        """
        if re.match(self.password_pattern, password) is None:
            raise ValidationError(
                _(
                    mark_safe(
                        '<div class="alert alert-danger text-center" role="alert">'
                        "<li><b>"
                        + _("Your password must contain at least")
                        + ":</b></li>"
                        "<li><b>8</b> " + _("letters") + "</li>"
                        "<li><b>1</b> " + _("uppercase") + "</li>"
                        "<li><b>1</b> " + _("lowercase") + "</li>"
                        "<li><b>1</b> " + _("symbol") + "</li>"
                        "<li><b>1</b> " + _("number") + "</li>"
                        "</div>"
                    )
                ),
                code="password_too_weak",
            )

    def get_help_text(self):
        """docstring"""
        return _(
            '<div class="alert alert-danger text-center text-red-600 mt-2 hidden" role="alert" id="password_help_text">'
            "<ul>"
            "<li>" + _("Your password must contain at least") + ":</li>"
            "<li><b>8</b> " + _("letters") + "</li>"
            "<li><b>1</b> " + _("uppercase") + "</li>"
            "<li><b>1</b> " + _("lowercase") + "</li>"
            "<li><b>1</b> " + _("symbol") + "</li>"
            "<li><b>1</b> " + _("number") + "</li>"
            "</ul>"
            "</div>"
        )
        
class CheckPassword2Policy:
    """docstring"""

    def __init__(self):
        self.password_pattern = (
            "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$"
        )

    def validate(self, password):
        """
            Your passwords must match
        """

    def get_help_text(self):
        """docstring"""
        return _(
            '<div class="alert alert-danger text-center text-red-600 mt-2 hidden" role="alert" id="password2_help_text">'
            "<ul>"
            "<li class='gap-2'><i class='fas fa-exclamation-triangle'></i>" + _("Your passwords must match") + "</li>"
            "</ul>"
            "</div>"
        )


class CheckUsernameAlreadyUsed:
    """docstring"""

    def __init__(self):
        self.table = User

    def validate(self, user):
        """
        check if username already exists in db.
        """
        if self.table.objects.filter(username=user).exists() is True:
            unique_username = _("Username already in use")
            raise ValidationError(
                _(
                    mark_safe(
                        '<div class="alert alert-danger text-center" role="alert">'
                        "<p><i class="
                        + '"fas fa-exclamation-triangle"'
                        + "></i>"
                        + unique_username
                        + "</p>"
                        "</div>"
                    )
                ),
                code="username_already_used",
            )

    def get_help_text(self):
        """docstring"""
        unique_username_msg = _("Username should be unique")
        return _(
            '<div class="alert alert-danger text-center text-red-600 mt-2 hidden" role="alert" id="username_help_text">'
            "<ul class='gap-1'>"
            "<li class='flex flex-row gap-2 justify-center items-center'><i class="
            + '"fas fa-exclamation-triangle"'
            + "></i><p>"
            + unique_username_msg
            + "</li></p>"
            "</ul>"
            "</div>"
        )

class CheckEmailAlreadyUsed:
    """docstring"""

    def __init__(self):
        self.table = User

    def validate(self, email):
        """check if email already exists in db."""
        if self.table.objects.filter(email=email).exists() is True:
            unique_email = _("Email already in use or the email address is badly formatted.")
            raise ValidationError(
                _(
                    mark_safe(
                        '<div class="alert alert-danger text-center col-xl-12 col-md-12 col-sm-10 mt-2" role="alert">'
                        "<p><i class="
                        + '"fas fa-exclamation-triangle"'
                        + "></i>"
                        + unique_email
                        + "</p>"
                        "</div>"
                    )
                ),
                code="email_already_used",
            )

    def get_help_text(self):
        """docstring"""
        unique_email = _("Email already in use")
        return _(
            '<div class="alert alert-danger text-center text-red-600 mt-2 hidden" role="alert" id="email_help_text">'
            "<ul class='gap-1'>"
            "<li class='flex flex-row gap-2 justify-center items-center'><i class="
            + '"fas fa-exclamation-triangle"'
            + "></i><p>"
            + unique_email
            + "</li></p>"
            "</ul>"
            "</div>"
        )
            
class CheckImageExtension:
    """docstring"""

    def __init__(self):
        self.table = ""

    def validate(self, file):
        """
        check if extension is allowed.
        """
        allowed_extensions = [".jpg", ".png"]
        if not Path(file.name.lower()).suffixes[0] in allowed_extensions:
            raise ValidationError(
                _(
                    mark_safe(
                        '<div class="alert alert-danger text-center" role="alert">'
                        "<p><i class="
                        + '"fas fa-exclamation-triangle"'
                        + "></i> Extensions autorisées: <b>.jpg et .png</b></p>"
                        "</div>"
                    )
                ),
                code="extension_not_allowed",
            )
