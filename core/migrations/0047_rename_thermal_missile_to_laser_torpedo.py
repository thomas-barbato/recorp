from django.db import migrations, models


REPLACEMENTS = [
    ("default_thermal_defense", "default_laser_defense"),
    ("default_missile_defense", "default_torpedo_defense"),
    ("current_thermal_defense", "current_laser_defense"),
    ("current_missile_defense", "current_torpedo_defense"),
    ("max_thermal_defense", "max_laser_defense"),
    ("max_missile_defense", "max_torpedo_defense"),
    ("thermal_defense", "laser_defense"),
    ("missile_defense", "torpedo_defense"),
    ("DEFENSE_THERMAL", "DEFENSE_LASER"),
    ("DEFENSE_MISSILE", "DEFENSE_TORPEDO"),
    ("Thermal Weapon", "Laser Weapon"),
    ("Missile Weapon", "Torpedo Weapon"),
    ("Thermal Shield", "Laser Shield"),
    ("Missile Shield", "Torpedo Shield"),
    ("Thermal defense", "Laser defense"),
    ("Missile defense", "Torpedo defense"),
    ("Thermal damages", "Laser damages"),
    ("Missile damages", "Torpedo damages"),
    ("thermal damages", "laser damages"),
    ("missile damages", "torpedo damages"),
    ("THERMAL", "LASER"),
    ("MISSILE", "TORPEDO"),
    ("Thermal", "Laser"),
    ("Missile", "Torpedo"),
    ("thermal", "laser"),
    ("missile", "torpedo"),
]


TEXT_FIELD_TYPES = (models.CharField, models.TextField, models.JSONField)


def _replace_in_string(value):
    if not isinstance(value, str):
        return value

    updated = value
    for old, new in REPLACEMENTS:
        updated = updated.replace(old, new)
    return updated.replace("game-icons--torpedo-swarm", "game-icons--missile-swarm")


def _replace_in_value(value):
    if isinstance(value, str):
        return _replace_in_string(value)
    if isinstance(value, list):
        return [_replace_in_value(item) for item in value]
    if isinstance(value, dict):
        return {
            _replace_in_string(key) if isinstance(key, str) else key: _replace_in_value(item)
            for key, item in value.items()
        }
    return value


def rename_existing_data(apps, schema_editor):
    core_app = apps.get_app_config("core")

    for model in core_app.get_models():
        managed_fields = [
            field
            for field in model._meta.local_fields
            if isinstance(field, TEXT_FIELD_TYPES)
        ]
        if not managed_fields:
            continue

        for obj in model.objects.all().iterator():
            update_fields = []
            for field in managed_fields:
                current_value = getattr(obj, field.name)
                if current_value is None:
                    continue

                updated_value = _replace_in_value(current_value)
                if updated_value != current_value:
                    setattr(obj, field.name, updated_value)
                    update_fields.append(field.name)

            if update_fields:
                obj.save(update_fields=update_fields)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0046_rename_core_players_player__f9af6e_idx_core_player_player__1dc6a2_idx_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="ship",
            old_name="default_thermal_defense",
            new_name="default_laser_defense",
        ),
        migrations.RenameField(
            model_name="ship",
            old_name="default_missile_defense",
            new_name="default_torpedo_defense",
        ),
        migrations.RenameField(
            model_name="npctemplate",
            old_name="max_thermal_defense",
            new_name="max_laser_defense",
        ),
        migrations.RenameField(
            model_name="npctemplate",
            old_name="max_missile_defense",
            new_name="max_torpedo_defense",
        ),
        migrations.RenameField(
            model_name="npc",
            old_name="thermal_defense",
            new_name="laser_defense",
        ),
        migrations.RenameField(
            model_name="npc",
            old_name="missile_defense",
            new_name="torpedo_defense",
        ),
        migrations.RenameField(
            model_name="playership",
            old_name="current_thermal_defense",
            new_name="current_laser_defense",
        ),
        migrations.RenameField(
            model_name="playership",
            old_name="current_missile_defense",
            new_name="current_torpedo_defense",
        ),
        migrations.RenameField(
            model_name="playership",
            old_name="max_thermal_defense",
            new_name="max_laser_defense",
        ),
        migrations.RenameField(
            model_name="playership",
            old_name="max_missile_defense",
            new_name="max_torpedo_defense",
        ),
        migrations.AlterField(
            model_name="module",
            name="type",
            field=models.CharField(
                choices=[
                    ("NONE", "none"),
                    ("WEAPONRY", "weaponry"),
                    ("DEFENSE_BALLISTIC", "defense_ballistic"),
                    ("DEFENSE_LASER", "defense_laser"),
                    ("DEFENSE_TORPEDO", "defense_torpedo"),
                    ("HULL", "hull"),
                    ("MOVEMENT", "movement"),
                    ("GATHERING", "gathering"),
                    ("PROBE", "probe"),
                    ("REPAIRE", "repaire"),
                    ("ELECTRONIC_WARFARE", "electronic warfare"),
                    ("RESEARCH", "research"),
                    ("CRAFT", "craft"),
                    ("HOLD", "hold"),
                    ("COLONIZATION", "colonization"),
                ],
                default="NONE",
                max_length=30,
            ),
        ),
        migrations.RunPython(rename_existing_data, migrations.RunPython.noop),
    ]
