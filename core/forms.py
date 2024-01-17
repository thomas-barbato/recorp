from django import forms


class CropImageForm(forms.Form):

    CATEGORIES = (
        ("PLANET", "planet"),
        ("MAP", "map"),
        ("STATION", "station"),
        ("ASTEROID", "asteroid")
    )

    img_input = forms.ImageField(label="image_url", required=True)
    category = forms.ChoiceField(choices=CATEGORIES, required=True)
