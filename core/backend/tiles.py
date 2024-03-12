from PIL import Image
from recorp.settings import BASE_DIR
from pathlib import Path
import os


class CropThisImage:
    def __init__(self, file, category: str, type: str, directory_name: str, size=32):
        self.file = Image.open(file)
        self.size = size
        self.type = type
        self.category = category.lower()
        self.directory_name = directory_name
        if self.category == "foreground":
            self.parent_path = Path(
                os.path.join(BASE_DIR, "recorp", "static", "img", "atlas", self.category, self.type)
            )
        else:
            self.parent_path = Path(
                os.path.join(BASE_DIR, "recorp", "static", "img", "atlas", self.category)
            )

        self.save_path = ""

    def __get_and_create_dir(self):
        self.save_path = Path(os.path.join(self.parent_path, self.directory_name))

        if os.path.exists(self.parent_path):
            self.save_path = Path(
                os.path.join(self.parent_path, self.directory_name)
            )

        self.save_path.mkdir(parents=True, exist_ok=True)

    def crop_and_save(self):
        self.__get_and_create_dir()
        width, height = self.file.size
        frame_number = 0
        for col in range(0, height, self.size):
            for row in range(0, width, self.size):
                crop = self.file.crop((row, col, row + self.size, col + self.size))
                save_to = os.path.join(self.save_path, f"{frame_number}.png")
                crop.save(save_to)
                frame_number += 1

    def get_save_path(self):
        return self.save_path
