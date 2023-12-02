import json
import logging
import random
import datetime
from django.utils import timezone
from django.contrib.auth import login
from django.http import JsonResponse
import request
from django.views.generic import RedirectView, TemplateView
from recorp.settings import MEDIA_URL

logger = logging.getLogger("django")


class DisplayGameView(TemplateView):
    template_name = "play.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context['france'] = timezone.localtime(timezone.now())
        context['now'] = datetime.datetime.now()
        logger.info(f'{timezone.localtime(timezone.now())} - {self.request.user} connected.')
        return context
