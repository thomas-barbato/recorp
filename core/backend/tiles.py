from PIL import Image, ImageDraw, ImageFilter
from recorp.settings import BASE_DIR, STATIC_URL
from pathlib import Path
import os


class CropThisImage:
    def __init__(self, file, category: str, size=32):
        self.file = Image.open(file)
        self.size = size
        self.start = 0
        self.category = category
        self.parent_path = Path(os.path.join(BASE_DIR, STATIC_URL, 'img', 'atlas', self.category))
        self.save_path = ""

    def __get_or_create_dir(self):
        if os.path.isdir(self.parent_path) is False:
            print("dedans")
            self.parent_path.mkdir(parents=False)
        # get parent_path + subdirectory named by len of parent directory (1, 2 , 3...)
        # to isolate all croped image in it own directory
        self.save_path = Path(os.path.join(self.parent_path, f"{len(os.listdir(self.parent_path))}"))
        self.save_path.mkdir(parents=True)

    def crop_and_save(self):
        self.__get_or_create_dir()
        height, width = self.file.size
        print(height, width)
        frame_number = 1
        for col in (self.start, width, self.size):
            for row in (self.start, height, self.size):
                crop = self.file.crop((col, row, col + self.size, row + self.size))
                save_to = os.path.join(self.save_path, "{:03}.png")
                crop.save(save_to.format(frame_number))
                frame_number += 1

