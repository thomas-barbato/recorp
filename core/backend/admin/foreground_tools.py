from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import redirect
from django.urls import path

from core.backend.admin.sprite_sheet_generator import generate_missing_spritesheets


@staff_member_required
def generate_foreground_spritesheets_view(request):
    logs, errors = generate_missing_spritesheets()

    for line in logs:
        messages.success(request, line)

    for err in errors:
        messages.error(request, err)

    if not logs and not errors:
        messages.info(request, "Aucune sprite sheet à générer.")

    return redirect("/admin/")
