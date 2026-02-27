from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0038_playershipinventorymodule_and_reconfiguration"),
    ]

    operations = [
        migrations.AddField(
            model_name="player",
            name="credit_amount",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="resource",
            name="takes_inventory_space",
            field=models.BooleanField(default=True),
        ),
    ]

