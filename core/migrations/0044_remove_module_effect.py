from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0043_module_subtype_and_effects"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="module",
            name="effect",
        ),
    ]

