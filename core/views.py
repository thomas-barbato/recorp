import json
import logging
import random
import datetime

from django.shortcuts import render
from django.utils import timezone
from django.contrib.auth import login
from django.http import JsonResponse
import request
from django.views.generic import RedirectView, TemplateView
from recorp.settings import MEDIA_URL
from django.utils.translation import gettext as _

logger = logging.getLogger("django")


class DisplayGameView(TemplateView):
    template_name = "play.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context['france'] = timezone.localtime(timezone.now())
        context['now'] = datetime.datetime.now()
        #logger.info(f'{timezone.localtime(timezone.now())} - {self.request.user} connected.')
        return context


def lang_view(request):
    context = {
        'static_string_1': 'first static string to translate',
        'static_string_2': 'second static string to translate',
        'second_paragraph': 'This is a second paragraph to translate',
    }
    return render(request, 'lang.html', context)