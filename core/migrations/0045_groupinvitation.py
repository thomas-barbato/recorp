from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0044_remove_module_effect"),
    ]

    operations = [
        migrations.CreateModel(
            name="GroupInvitation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("PENDING", "pending"), ("ACCEPTED", "accepted"), ("DECLINED", "declined"), ("CANCELED", "canceled"), ("EXPIRED", "expired")], db_index=True, default="PENDING", max_length=12)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, verbose_name="creation date")),
                ("responded_at", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("group", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="invitations", to="core.group")),
                ("invitee", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="group_invitations_received", to="core.player")),
                ("inviter", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="group_invitations_sent", to="core.player")),
            ],
            options={
                "indexes": [
                    models.Index(fields=["invitee", "status", "-created_at"], name="grp_inv_invitee_idx"),
                    models.Index(fields=["group", "status"], name="grp_inv_group_idx"),
                ],
            },
        ),
    ]
