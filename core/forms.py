from django import forms


class CropImageForm(forms.Form):

    CATEGORIES = (
        ("BACKGROUND", "background"),
        ("FOREGROUND", "foreground"),
    )

    img_input = forms.ImageField(label="image_url", required=True)
    category = forms.ChoiceField(choices=CATEGORIES, required=True)
    file_directory_name = forms.CharField(label="name directory were this map will be saved", required=True)
