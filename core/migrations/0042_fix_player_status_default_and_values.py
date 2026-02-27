from django.db import migrations, models


def normalize_player_status_values(apps, schema_editor):
    Player = apps.get_model("core", "Player")

    Player.objects.filter(status="('ALIVE', 'alive')").update(status="ALIVE")
    Player.objects.filter(status='("ALIVE", "alive")').update(status="ALIVE")
    Player.objects.filter(status="('DEAD', 'dead')").update(status="DEAD")
    Player.objects.filter(status='("DEAD", "dead")').update(status="DEAD")


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0041_force_bank_float_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="player",
            name="status",
            field=models.CharField(
                choices=[("ALIVE", "alive"), ("DEAD", "dead")],
                default="ALIVE",
                max_length=20,
            ),
        ),
        migrations.RunPython(normalize_player_status_values, migrations.RunPython.noop),
    ]
