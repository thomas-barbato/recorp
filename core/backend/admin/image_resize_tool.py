# core/backend/admin/image_resize_tool.py
from uuid import uuid4
from django.views.generic import TemplateView
from django.contrib import messages
from django.shortcuts import redirect
from django.conf import settings
from PIL import Image
from pathlib import Path
import base64
from io import BytesIO

from core.forms import AdminImageResizeForm


class AdminImageResizeView(TemplateView):
    template_name = "admin/image_resize_tool.html"
    form_class = AdminImageResizeForm

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        preview = self.request.session.pop("image_resize_preview", None)
        if preview:
            ctx["preview_after"] = preview["preview_after"]
            ctx["form"] = self.form_class(preview["form_data"])
        else:
            ctx["form"] = self.form_class()
        return ctx

    def post(self, request):
        form = self.form_class(request.POST, request.FILES)

        if not form.is_valid():
            return self.render_to_response({"form": form})

        width = form.cleaned_data["width"]
        height = form.cleaned_data["height"]
        rotate = form.cleaned_data["rotate"]
        angle = form.cleaned_data["rotation_angle"] or 0
        use_contain = form.cleaned_data["use_contain"]

        # dossier de sortie
        output_dir = Path(settings.STATIC_ROOT) / "img" / "resized"
        output_dir.mkdir(parents=True, exist_ok=True)

        # ouverture image (upload initial OU image temporaire)
        tmp_path = request.session.get("image_resize_tmp")

        if tmp_path and Path(tmp_path).exists():
            img = Image.open(tmp_path).convert("RGBA").copy()
            image_name = Path(tmp_path).name
        else:
            image_file = form.cleaned_data["image"]
            
            # SÉCURITÉ : empêcher l'upload depuis /tmp
            if "tmp" in image_file.name.replace("\\", "/"):
                form.add_error(
                    "image",
                    "Cette image est déjà en cours de traitement. "
                    "Utilisez simplement « Sauvegarder »."
                )
                return self.render_to_response({"form": form})

            img = Image.open(image_file).convert("RGBA")
            image_name = image_file.name
            
        # rotation AVANT resize (meilleure qualité)
        if rotate and angle != 0:
            img = img.rotate(-angle, expand=True, resample=Image.BICUBIC)
            
        # suppression des zones transparentes
        img = crop_to_content(img)

        # resize sans dégradation
        if use_contain:
            img = resize_contain(img, width, height)
        else:
            img = img.resize((width, height), Image.LANCZOS)
            
        context = {
            "form": form,
            "preview_after": image_to_base64(img),
            "can_save": True
        }

        # si bouton "Aperçu" cliqué
        if "preview" in request.POST:
            tmp_dir = Path(settings.MEDIA_ROOT) / "tmp"
            tmp_dir.mkdir(parents=True, exist_ok=True)

            tmp_name = f"{uuid4().hex}.png"
            tmp_path = tmp_dir / tmp_name

            # 🔥 ON SAUVEGARDE L’IMAGE FINALE
            img.save(tmp_path, format="PNG")

            request.session["image_resize_preview"] = {
                "preview_after": image_to_base64(img),
                "form_data": request.POST,
            }
            request.session["image_resize_tmp"] = str(tmp_path)

            return redirect(request.path)
        
        # dossier de sortie
        output_dir = Path(settings.STATIC_ROOT) / "img" / "resized"
        output_dir.mkdir(parents=True, exist_ok=True)

        output_path = output_dir / image_name

        # casser toute référence fichier (Windows)
        final_img = img.copy()
        final_img.save(output_path, format="PNG")
        
        # nettoyage img
        img = None
        # nettoyage tmp
        tmp_path = request.session.pop("image_resize_tmp", None)
        if tmp_path and Path(tmp_path).exists():
            Path(tmp_path).unlink()
        

        messages.success(
            request,
            f"Image traitée avec succès → {output_path}"
        )

        return redirect(request.path)
    
def crop_to_content(img):
    """
    Supprime les marges transparentes autour du dessin.
    """
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)

    # image entièrement transparente (cas extrême)
    return img
    
def resize_contain(img, target_w, target_h):
    src_w, src_h = img.size

    scale = min(target_w / src_w, target_h / src_h)

    new_w = int(src_w * scale)
    new_h = int(src_h * scale)

    resized = img.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))

    offset_x = (target_w - new_w) // 2
    offset_y = (target_h - new_h) // 2

    canvas.paste(resized, (offset_x, offset_y), resized)

    return canvas

def image_to_base64(img):
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")