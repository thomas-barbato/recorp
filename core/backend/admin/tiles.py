from PIL import Image, ImageSequence
from recorp.settings import BASE_DIR
from pathlib import Path
import json
import os


class UploadThisImage:
    def __init__(self, uploaded_file, category: str, element_id: str, directory_name: str):
        # ✅ On garde le fichier Django (InMemoryUploadedFile / TemporaryUploadedFile)
        self.uploaded_file = uploaded_file
        self.original_filename = Path(getattr(uploaded_file, "name", "upload.bin")).name

        # ✅ Pillow ne servira que si besoin (GIF / frames)
        self.file = Image.open(uploaded_file)

        self.element_id = element_id
        self.category = category.lower().strip()
        self.directory_name = directory_name.strip()
        self.save_path = None

        if self.category == "foreground":
            self.parent_path = Path(os.path.join(BASE_DIR, "recorp", "static", "img", "foreground"))
        elif self.category == "users":
            self.parent_path = Path(os.path.join(BASE_DIR, "recorp", "static", "img", "users", str(self.element_id)))
        else:
            self.parent_path = Path(os.path.join(BASE_DIR, "recorp", "static", "img", self.category))

    def _get_and_create_dir(self):
        if self.category == "users":
            self.save_path = self.parent_path
            if os.path.exists(self.save_path) is False:
                self.save_path.mkdir(parents=True, exist_ok=True)
        else:
            self.save_path = self.parent_path / self.directory_name
        self.save_path.mkdir(parents=True, exist_ok=True)

    def _save_uploaded_file_raw(self, dest_path: Path):
        """
        ✅ Copie le fichier uploadé tel quel (recommandé pour ships PNG)
        """
        # On remet le curseur au début au cas où Pillow a déjà lu le flux
        try:
            self.uploaded_file.seek(0)
        except Exception:
            pass

        with open(dest_path, "wb") as out:
            for chunk in self.uploaded_file.chunks():
                out.write(chunk)

    def save(self, keep_original_name=False, ships_mode=False):
        self._get_and_create_dir()

        # ✅ ships_mode: toujours PNG, on garde le nom original, on copie brut
        if ships_mode:
            # Optionnel: forcer l’extension .png
            if not self.original_filename.lower().endswith(".png"):
                raise ValueError("Les vaisseaux doivent être au format .png")

            dest_path = self.save_path / self.original_filename
            self._save_uploaded_file_raw(dest_path)
            return dest_path

        # Sinon: logique actuelle (GIF 0.gif + frames si foreground)
        gif_path = self.save_path / "0.gif"
        # ⚠️ Ne pas append_images=[self.file]
        if self.file.format == "GIF":
            self.file.save(gif_path, save_all=True)
        else:
            # image statique -> gif 1 frame
            self.file.save(gif_path, format="GIF")

        if self.category == "foreground":
            self.extract_gif_frames(str(gif_path))

        return gif_path

    def get_save_path(self):
        return self.save_path

    def extract_gif_frames(self, gif_path):
        gif = Image.open(gif_path)

        frames_dir = self.save_path / "frames"
        frames_dir.mkdir(parents=True, exist_ok=True)

        frame_durations = []
        frame_index = 0

        for frame in ImageSequence.Iterator(gif):
            frame = frame.convert("RGBA")
            duration = frame.info.get("duration", 100)
            frame_durations.append(duration)

            frame.save(frames_dir / f"frame-{frame_index}.png", format="PNG")
            frame_index += 1

        anim_data = {
            "frame_count": frame_index,
            "durations": frame_durations
        }

        with open(frames_dir / "animation.json", "w") as f:
            json.dump(anim_data, f, indent=4)

        return frame_index