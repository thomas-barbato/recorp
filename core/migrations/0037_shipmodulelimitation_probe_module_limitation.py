from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0036_npctemplate_respawn_delay_seconds"),
    ]

    operations = [
        migrations.AddField(
            model_name="shipmodulelimitation",
            name="probe_module_limitation",
            field=models.PositiveSmallIntegerField(default=1),
        ),
    ]
