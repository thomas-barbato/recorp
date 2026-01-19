from core.models import Log, PlayerLog
from django.db import transaction

@transaction.atomic
def create_event_log(*, players, log_type, content):
    """
    Crée UN log et l'associe à PLUSIEURS joueurs

    players : iterable de Player
    """
    log = Log.objects.create(
        log_type=log_type,
        content=content
    )

    PlayerLog.objects.bulk_create([
        PlayerLog(player=player, log=log)
        for player in players
    ])

    return log