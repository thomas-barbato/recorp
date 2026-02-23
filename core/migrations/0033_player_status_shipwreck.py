from django.db import migrations, models
import django.db.models.deletion
from django.utils import timezone


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0032_remove_npc_max_hp"),
    ]

    operations = [
        migrations.AddField(
            model_name="player",
            name="status",
            field=models.CharField(
                choices=[("ALIVE", "alive"), ("DEAD", "dead")],
                default="ALIVE",
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="ShipWreck",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("origin_type", models.CharField(choices=[("PC", "player"), ("NPC", "npc")], default="PC", max_length=10)),
                ("coordinates", models.JSONField(null=True)),
                ("status", models.CharField(choices=[("ACTIVE", "active"), ("LOOTED", "looted"), ("SALVAGED", "salvaged"), ("EXPIRED", "expired")], default="ACTIVE", max_length=20)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(default=timezone.now, verbose_name="creation date")),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("killer_player", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ship_wrecks_kills", to="core.player")),
                ("origin_npc", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ship_wrecks_origin", to="core.npc")),
                ("origin_player", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ship_wrecks_origin", to="core.player")),
                ("sector", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ship_wrecks", to="core.sector")),
                ("ship", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ship_wrecks", to="core.ship")),
            ],
        ),
    ]
