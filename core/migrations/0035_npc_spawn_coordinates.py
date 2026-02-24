from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0034_alter_player_status_alter_shipwreck_origin_type_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="npc",
            name="spawn_coordinates",
            field=models.JSONField(blank=True, null=True),
        ),
    ]

