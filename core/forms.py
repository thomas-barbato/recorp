from django import forms


class CropImageForm(forms.Form):

    CATEGORIES = (
        ("BACKGROUND", "background"),
        ("FOREGROUND", "foreground"),
    )

    TYPES = (
        ("PLANET", "planet"),
        ("ASTEROID", "asteroid"),
        ("STATION", "station")
    )

    img_input = forms.ImageField(label="image_url", required=True)
    category = forms.ChoiceField(choices=CATEGORIES, required=True)
    type = forms.ChoiceField(choices=TYPES, required=False)
    file_directory_name = forms.CharField(label="name directory were this map will be saved", required=True)
