# core/backend/admin/image_resize_tool.py
from django.views.generic import TemplateView
from django.contrib import messages
from django.conf import settings
from PIL import Image
from pathlib import Path

from core.forms import AdminImageResizeForm


class AdminImageResizeView(TemplateView):
    template_name = "admin/image_resize_tool.html"
    form_class = AdminImageResizeForm

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["form"] = self.form_class()
        return ctx

    def post(self, request):
        form = self.form_class(request.POST, request.FILES)

        if not form.is_valid():
            return self.render_to_response({"form": form})

        image_file = form.cleaned_data["image"]
        width = form.cleaned_data["width"]
        height = form.cleaned_data["height"]
        rotate = form.cleaned_data["rotate"]
        angle = form.cleaned_data["rotation_angle"] or 0

        # dossier de sortie
        output_dir = Path(settings.BASE_DIR) / "recorp" / "static" / "img" / "resized"
        output_dir.mkdir(parents=True, exist_ok=True)

        # ouverture image
        img = Image.open(image_file).convert("RGBA")

        # rotation AVANT resize (meilleure qualité)
        if rotate and angle != 0:
            img = img.rotate(-angle, expand=True, resample=Image.BICUBIC)

        # resize sans dégradation
        img = img.resize((width, height), Image.LANCZOS)

        # sauvegarde
        output_path = output_dir / image_file.name
        img.save(output_path, format="PNG")

        messages.success(
            request,
            f"Image traitée avec succès → {output_path}"
        )

        return self.render_to_response({"form": self.form_class()})