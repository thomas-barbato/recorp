from decimal import Decimal
from django.db import migrations, models


def _is_credit_resource(resource_obj):
    if not resource_obj:
        return False

    name = str(getattr(resource_obj, "name", "") or "").strip().lower()
    if name in {"credit", "credits"}:
        return True

    data = getattr(resource_obj, "data", None)
    if not isinstance(data, dict):
        return False

    if bool(data.get("is_credit")) or bool(data.get("credit")):
        return True

    for key in ("resource_type", "type", "category", "inventory_section"):
        raw = data.get(key)
        if raw is None:
            continue
        if str(raw).strip().upper() in {"CREDIT", "CREDITS", "CURRENCY"}:
            return True

    return False


def copy_ship_credit_from_resources(apps, schema_editor):
    PlayerShip = apps.get_model("core", "PlayerShip")
    PlayerShipResource = apps.get_model("core", "PlayerShipResource")

    rows = (
        PlayerShipResource.objects
        .select_related("resource")
        .all()
    )

    by_ship = {}
    for row in rows.iterator():
        resource = getattr(row, "resource", None)
        if not _is_credit_resource(resource):
            continue
        ship_id = row.source_id
        qty = Decimal(str(getattr(row, "quantity", 0) or 0))
        by_ship[ship_id] = by_ship.get(ship_id, Decimal("0.00")) + qty

    for ship in PlayerShip.objects.all().iterator():
        total = by_ship.get(ship.id)
        if total is None:
            continue
        ship.credit_amount = float(total.quantize(Decimal("0.01")))
        ship.save(update_fields=["credit_amount", "updated_at"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0039_player_credit_amount_and_resource_takes_inventory_space"),
    ]

    operations = [
        migrations.AlterField(
            model_name="player",
            name="credit_amount",
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name="playership",
            name="credit_amount",
            field=models.FloatField(default=0.0),
        ),
        migrations.RunPython(copy_ship_credit_from_resources, migrations.RunPython.noop),
    ]
