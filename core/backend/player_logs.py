from core.models import Log, PlayerLog
from django.db import transaction

@transaction.atomic
def create_event_log(
    *,
    players_roles: list[tuple],
    log_type: str,
    payload: dict
):
    """
    Crée UN log et l'associe à PLUSIEURS joueurs avec un rôle

    players_roles = [
        (player_obj, "TRANSMITTER"),
        (player_obj, "RECEIVER"),
        (player_obj, "OBSERVER"),
    ]
    """

    log = Log.objects.create(
        log_type=log_type,
        content=payload
    )

    PlayerLog.objects.bulk_create([
        PlayerLog(
            player=player,
            log=log,
            role=role
        )
        for player, role in players_roles
    ])

    return log