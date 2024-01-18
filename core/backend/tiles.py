from PIL import Image, ImageDraw, ImageFilter
from recorp.settings import BASE_DIR
from pathlib import Path
import os


class CropThisImage:
    def __init__(self, file, category: str, size=32):
        self.file = Image.open(file)
        self.size = size
        self.category = category
        self.parent_path = Path(os.path.join(BASE_DIR, 'recorp', 'static', 'img', 'atlas', self.category))
        self.save_path = ""

    def __get_and_create_dir(self):
        # check if path exists
        # get parent_path + subdirectory named by len of parent directory (1, 2 , 3...)
        # to isolate all croped image in it own directory
        self.save_path = Path(os.path.join(self.parent_path, "0"))

        if os.path.exists(self.parent_path):
            self.save_path = Path(os.path.join(self.parent_path,  f"{len(os.listdir(self.parent_path))}"))

        self.save_path.mkdir(parents=True, exist_ok=True)

    def crop_and_save(self):
        self.__get_and_create_dir()
        width, height = self.file.size
        frame_number = 1
        for col in range(0, width, self.size):
            for row in range(0, height, self.size):
                crop = self.file.crop((col, row, col + self.size, row + self.size))
                save_to = os.path.join(self.save_path, f"{frame_number}.png")
                crop.save(save_to)
                frame_number += 1

