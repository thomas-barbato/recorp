from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0035_npc_spawn_coordinates"),
    ]

    operations = [
        migrations.AddField(
            model_name="npctemplate",
            name="respawn_delay_seconds",
            field=models.PositiveIntegerField(default=120),
        ),
    ]

