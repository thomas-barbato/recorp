import os
from PIL import Image
from django.conf import settings

class UserAvatarWriter:
    """
    Gestion EXCLUSIVE de l'avatar utilisateur.
    static/img/users/{user_id}/0.gif
    """

    SIZE = (256, 256)
    FILENAME = "0.gif"

    def __init__(self, file_obj, user_id: int):
        self.file = file_obj
        self.user_id = user_id

    def _get_target_dir(self) -> str:
        return os.path.join(
            settings.BASE_DIR,
            "recorp",
            "static",
            "img",
            "users",
            str(self.user_id)
        )

    def _get_target_path(self) -> str:
        return os.path.join(self._get_target_dir(), self.FILENAME)

    def save(self) -> str:
        # 1️⃣ Dossier
        target_dir = self._get_target_dir()
        os.makedirs(target_dir, exist_ok=True)

        # 2️⃣ Ouvrir image
        self.file.seek(0)
        img = Image.open(self.file)

        # 3️⃣ Normalisation (RGBA → RGB)
        if img.mode in ("RGBA", "LA"):
            bg = Image.new("RGB", img.size, (0, 0, 0))
            bg.paste(img, mask=img.split()[-1])
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # 4️⃣ Resize
        img.thumbnail(self.SIZE, Image.LANCZOS)

        # 5️⃣ CONVERSION PALETTE (OBLIGATOIRE POUR GIF)
        img = img.convert(
            "P",
            palette=Image.ADAPTIVE,
            colors=256
        )

        # 6️⃣ Save GIF
        target_path = self._get_target_path()
        img.save(
            target_path,
            format="GIF",
            optimize=True
        )

        return target_path
