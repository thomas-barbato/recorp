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
        context['skills'] = {
            'categories': ['Steering', 'Offensive', 'Defensive', 'Utility', 'Industry'],
            'list': [
                {'skill_name': 'Frigate', 'level': 1, 'progress': 5, 'cat': 'Steering'},
                {'skill_name': 'Destroyer', 'level': 3, 'progress': 35, 'cat': 'Steering'},
                {'skill_name': 'Cruiser', 'level': 1, 'progress': 10, 'cat': 'Steering'},
                {'skill_name': 'Battlecruiser', 'level': 1, 'progress': 75, 'cat': 'Steering'},
                {'skill_name': 'Laser', 'level': 1, 'progress': 5, 'cat': 'Offensive'},
                {'skill_name': 'Solide Weapon', 'level': 1, 'progress': 35, 'cat': 'Offensive'},
                {'skill_name': 'Missile', 'level': 1, 'progress': 10, 'cat': 'Offensive'},
                {'skill_name': 'Electronic Warfare', 'level': 5, 'progress': 20, 'cat': 'Offensive'},
                {'skill_name': 'Evasive maneuver', 'level': 1, 'progress': 50, 'cat': 'Defensive'},
                {'skill_name': 'Thermal Shield', 'level': 101, 'progress': 19, 'cat': 'Defensive'},
                {'skill_name': 'Ballistic Shield', 'level': 1, 'progress': 10, 'cat': 'Defensive'},
                {'skill_name': 'Missile Shield', 'level': 4, 'progress': 75, 'cat': 'Defensive'},
                {'skill_name': 'Counter Electronic Warfare', 'level': 1, 'progress': 75, 'cat': 'Defensive'},
                {'skill_name': 'Mining', 'level': 1, 'progress': 40, 'cat': 'Industry'},
                {'skill_name': 'Refining', 'level': 1, 'progress': 30, 'cat': 'Industry'},
                {'skill_name': 'Crafting', 'level': 1, 'progress': 1, 'cat': 'Industry'},
                {'skill_name': 'Research', 'level': 79, 'progress': 75, 'cat': 'Industry'},
                {'skill_name': 'Planetary Exploitation', 'level': 1, 'progress': 75, 'cat': 'Industry'},
                {'skill_name': 'Repair', 'level': 1, 'progress': 30, 'cat': 'Utility'},
                {'skill_name': 'Shield Amelioration', 'level': 1, 'progress': 10, 'cat': 'Utility'},
                {'skill_name': 'Hide Signature', 'level': 1, 'progress': 75, 'cat': 'Utility'},
                {'skill_name': 'Detection', 'level': 1, 'progress': 75, 'cat': 'Utility'},
            ]
        }


        #logger.info(f'{timezone.localtime(timezone.now())} - {self.request.user} connected.')
        return context


def lang_view(request):
    context = {
        'static_string_1': 'first static string to translate',
        'static_string_2': 'second static string to translate',
        'second_paragraph': 'This is a second paragraph to translate',
    }
    return render(request, 'lang.html', context)