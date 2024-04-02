from PIL import Image
from recorp.settings import BASE_DIR
from pathlib import Path
import os


class UploadThisImage:
    def __init__(self, file, category: str, type: str, directory_name: str):
        self.file = Image.open(file)
        self.type = type
        self.category = category.lower()
        self.directory_name = directory_name
        if self.category == "foreground":
            self.parent_path = Path(
                os.path.join(
                    BASE_DIR,
                    "recorp",
                    "static",
                    "img",
                    "atlas",
                    self.category,
                    self.type,
                )
            )
        else:
            self.parent_path = Path(
                os.path.join(
                    BASE_DIR, "recorp", "static", "img", "atlas", self.category
                )
            )

        self.save_path = ""

    def __get_and_create_dir(self):
        self.save_path = Path(os.path.join(self.parent_path, self.directory_name))

        if os.path.exists(self.parent_path):
            self.save_path = Path(os.path.join(self.parent_path, self.directory_name))

        self.save_path.mkdir(parents=True, exist_ok=True)

    def save(self):
        self.__get_and_create_dir()
        save_to = os.path.join(self.save_path, "0.png")
        self.file.save(save_to)

    def get_save_path(self):
        return self.save_path
