from PIL import Image
from recorp.settings import BASE_DIR
from pathlib import Path
import os


class UploadThisImage:
    def __init__(self, file, category: str, element_id: str, directory_name: str):
        # for user type, 
        # element_id and directory_name are the same value.
        self.file = Image.open(file)
        self.element_id = element_id
        self.category = category.lower()
        self.directory_name = directory_name
        if self.category == "foreground":
            self.parent_path = Path(
                os.path.join(
                    BASE_DIR,
                    "recorp",
                    "static",
                    "img",
                    self.category,
                    self.element_id,
                )
            )
        elif self.category == "users":
            self.parent_path = Path(
                os.path.join(
                    BASE_DIR,
                    "recorp",
                    "static",
                    "img",
                    self.category,
                )
            )
        else:
            self.parent_path = Path(
                os.path.join(
                    BASE_DIR, "recorp", "static", "img", self.category
                )
            )

        self.save_path = ""

    def __get_and_create_dir(self):
        if self.category == "users":
            self.save_path = self.parent_path
            if os.path.exists(self.save_path) is False:
                self.save_path.mkdir(parents=True, exist_ok=True)
        else:
            self.save_path = Path(os.path.join(self.parent_path, self.directory_name))
            if os.path.exists(self.parent_path):
                self.save_path = Path(os.path.join(self.parent_path, self.directory_name))
            self.save_path.mkdir(parents=True, exist_ok=True)

    def save(self):
        self.__get_and_create_dir()
        save_to = os.path.join(self.save_path, "0.gif")
        print(save_to)
        self.file.save(save_to, format="GIF", save_all=True, duration=100, loop=0)

    def get_save_path(self):
        return self.save_path
