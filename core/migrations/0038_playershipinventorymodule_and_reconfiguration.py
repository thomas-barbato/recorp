from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0037_shipmodulelimitation_probe_module_limitation"),
    ]

    operations = [
        migrations.AddField(
            model_name="playership",
            name="equipment_blocked_until",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="PlayerShipInventoryModule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, verbose_name="creation date")),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("module", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="core.module")),
                ("player_ship", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="inventory_modules", to="core.playership")),
            ],
        ),
        migrations.CreateModel(
            name="PlayerShipModuleReconfiguration",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action_type", models.CharField(choices=[("EQUIP", "equip"), ("UNEQUIP", "unequip")], max_length=10)),
                ("status", models.CharField(choices=[("PENDING", "pending"), ("COMPLETED", "completed"), ("FAILED", "failed")], db_index=True, default="PENDING", max_length=10)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("execute_at", models.DateTimeField(db_index=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("equipped_module_entry", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reconfiguration_events", to="core.playershipmodule")),
                ("inventory_module_entry", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reconfiguration_events", to="core.playershipinventorymodule")),
                ("module", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="core.module")),
                ("player_ship", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="module_reconfigurations", to="core.playership")),
                ("requested_by_player", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="module_reconfigurations", to="core.player")),
            ],
            options={
                "indexes": [models.Index(fields=["player_ship", "status", "execute_at"], name="core_players_player__f9af6e_idx")],
            },
        ),
    ]
