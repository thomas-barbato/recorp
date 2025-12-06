from PIL import Image, ImageSequence
from recorp.settings import BASE_DIR
from pathlib import Path
import json
import os


class UploadThisImage:
    def __init__(self, file, category: str, element_id: str, directory_name: str):
        # for user type, 
        # element_id and directory_name are the same value.
        self.file = Image.open(file)
        self.element_id = element_id
        self.category = category.lower()
        self.directory_name = directory_name
        self.save_path = ""
        
        if self.category == "foreground":
            self.parent_path = Path(
                os.path.join(
                    BASE_DIR,
                    "recorp",
                    "static",
                    "img",
                    "foreground",
                )
            )
        elif self.category == "users":
            self.parent_path = Path(
                os.path.join(
                    BASE_DIR,
                    "recorp",
                    "static",
                    "img",
                    "users",
                    str(self.element_id)
                )
            )
        else:
            self.parent_path = Path(
                os.path.join(
                    BASE_DIR, "recorp", "static", "img", self.category
                )
            )


    def __get_and_create_dir(self):
        if self.category == "users":
            self.save_path = self.parent_path
            print(self.save_path)
            if os.path.exists(self.save_path) is False:
                self.save_path.mkdir(parents=True, exist_ok=True)
        else:
            self.save_path = Path(os.path.join(self.parent_path, self.directory_name))
            if os.path.exists(self.parent_path):
                self.save_path = Path(os.path.join(self.parent_path, self.directory_name))
            self.save_path.mkdir(parents=True, exist_ok=True)

    def save(self):
        self.__get_and_create_dir()
        gif_path = os.path.join(self.save_path, "0.gif")
        self.file.save(gif_path, format="GIF", save_all=True, append_images=[self.file], duration=100, loop=0)
        if self.category == "foreground":
            try:
                frame_count = self.extract_gif_frames(gif_path)
                print(f"[OK] Extracted {frame_count} frames for {gif_path}")
            except Exception as e:
                print(f"[ERROR] GIF extraction failed for {gif_path}: {e}")
        else:
            print(f"[INFO] No frame extraction needed for category '{self.category}'.")

    def get_save_path(self):
        return self.save_path
    
    def extract_gif_frames(self, gif_path):
        """Découpe un GIF en frames PNG + génère animation.json"""

        gif = Image.open(gif_path)

        # Dossier /frames/ à créer
        frames_dir = Path(os.path.join(self.save_path, "frames"))
        frames_dir.mkdir(parents=True, exist_ok=True)

        frame_index = 0
        frame_durations = []

        for frame in ImageSequence.Iterator(gif):
            frame = frame.convert("RGBA")  # préserver transparence
            duration = frame.info.get("duration", 100)
            frame_durations.append(duration)

            frame_path = frames_dir / f"frame-{frame_index}.png"
            frame.save(frame_path, format="PNG")

            frame_index += 1

        # Fichier JSON contenant les infos d’animation
        anim_data = {
            "frame_count": frame_index,
            "durations": frame_durations
        }

        json_path = frames_dir / "animation.json"
        with open(json_path, "w") as f:
            json.dump(anim_data, f, indent=4)

        return frame_index
