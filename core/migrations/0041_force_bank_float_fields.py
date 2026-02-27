from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0040_bank_decimal_amounts"),
    ]

    operations = [
        migrations.AlterField(
            model_name="player",
            name="credit_amount",
            field=models.FloatField(default=0.0),
        ),
        migrations.AlterField(
            model_name="playership",
            name="credit_amount",
            field=models.FloatField(default=0.0),
        ),
    ]
