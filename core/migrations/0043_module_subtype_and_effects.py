from django.db import migrations, models


def _backfill_module_effects(apps, schema_editor):
    Module = apps.get_model("core", "Module")

    for module in Module.objects.all().iterator():
        current_effects = module.effects if isinstance(module.effects, list) else []
        if current_effects:
            continue

        legacy_effect = module.effect if isinstance(module.effect, dict) else {}
        module.effects = [legacy_effect] if legacy_effect else []

        if not getattr(module, "subtype", None):
            module.subtype = "GENERIC"

        module.save(update_fields=["effects", "subtype", "updated_at"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0042_fix_player_status_default_and_values"),
    ]

    operations = [
        migrations.AddField(
            model_name="module",
            name="effects",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="module",
            name="subtype",
            field=models.CharField(blank=True, db_index=True, default="GENERIC", max_length=50),
        ),
        migrations.RunPython(_backfill_module_effects, migrations.RunPython.noop),
    ]

