import os
from recorp.settings import BASE_DIR


class GetMapDataFromDB:
    def __init__(self):
        pass

    @staticmethod
    def get_size():
        return [
            {"planet": {"size_x": 4, "size_y": 4}},
            {"station": {"size_x": 3, "size_y": 3}},
            {"asteroid": {"size_x": 1, "size_y": 1}}
        ]

    @staticmethod
    def get_fg_element_url(element):
        return os.listdir(
            os.path.join(BASE_DIR, "recorp", "static", "img", "atlas", "foreground", element)
        )

    @staticmethod
    def get_bg_fg_url(bg_fg_choice):
        return os.listdir(
            os.path.join(BASE_DIR, "recorp", "static", "img", "atlas", bg_fg_choice)
        )

    @staticmethod
    def get_map_size():
        return {"cols": 20, "rows": 15}

    @staticmethod
    def get_map_size_range():
        return {"cols": range(20), "rows": range(15)}
