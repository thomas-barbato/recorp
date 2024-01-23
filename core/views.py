import json
import logging
import random
import datetime
from django.template import RequestContext, loader
from django.shortcuts import render
from django.utils import timezone
from django.contrib.auth import login
from django.http import JsonResponse, HttpResponse
import request
from django.views.generic import RedirectView, TemplateView
from recorp.settings import MEDIA_URL
from django.utils.translation import gettext as _
from django.contrib import admin

logger = logging.getLogger("django")


def admin_index(request):
    template = loader.get_template("admin/base_site.html")
    context = RequestContext(request, {})
    return HttpResponse(template.render(context))


class DisplayGameView(TemplateView):
    template_name = "play.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context["france"] = timezone.localtime(timezone.now())
        context["now"] = datetime.datetime.now()
        context["loop"] = range(10)
        context["map_size"] = {"cols": range(20), "rows": range(15)}
        context["map_background"] = ""
        context["map_foreground"] = ""
        context[
            "description"
        ] = "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident"
        context["skills"] = {
            "categories": ["Steering", "Offensive", "Defensive", "Utility", "Industry"],
            "list": [
                {
                    "id": "1",
                    "skill_name": "Frigate",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 5,
                    "cat": "Steering",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "2",
                    "skill_name": "Destroyer",
                    "level": 3,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 35,
                    "cat": "Steering",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "3",
                    "skill_name": "Cruiser",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 10,
                    "cat": "Steering",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "4",
                    "skill_name": "Battlecruiser",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 75,
                    "cat": "Steering",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "5",
                    "skill_name": "Laser",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 5,
                    "cat": "Offensive",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "6",
                    "skill_name": "Solide Weapon",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 35,
                    "cat": "Offensive",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "7",
                    "skill_name": "Missile",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 10,
                    "cat": "Offensive",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "8",
                    "skill_name": "Electronic Warfare",
                    "level": 5,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 20,
                    "cat": "Offensive",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "9",
                    "skill_name": "Evasive maneuver",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 50,
                    "cat": "Defensive",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "10",
                    "skill_name": "Thermal Shield",
                    "level": 101,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 19,
                    "cat": "Defensive",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "11",
                    "skill_name": "Ballistic Shield",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 10,
                    "cat": "Defensive",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "12",
                    "skill_name": "Missile Shield",
                    "level": 4,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 75,
                    "cat": "Defensive",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "13",
                    "skill_name": "Counter Electronic Warfare",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 75,
                    "cat": "Defensive",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "14",
                    "skill_name": "Mining",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 40,
                    "cat": "Industry",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "15",
                    "skill_name": "Refining",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 30,
                    "cat": "Industry",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "16",
                    "skill_name": "Crafting",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 1,
                    "cat": "Industry",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "17",
                    "skill_name": "Research",
                    "level": 79,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 75,
                    "cat": "Industry",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "18",
                    "skill_name": "Planetary Exploitation",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 75,
                    "cat": "Industry",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "19",
                    "skill_name": "Repair",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 30,
                    "cat": "Utility",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "20",
                    "skill_name": "Shield Amelioration",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 10,
                    "cat": "Utility",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "21",
                    "skill_name": "Hide Signature",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 75,
                    "cat": "Utility",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
                {
                    "id": "22",
                    "skill_name": "Detection",
                    "level": 1,
                    "expertise": "Rookie",
                    "effects": "bliblibli +12 !",
                    "progress": 75,
                    "cat": "Utility",
                    "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.",
                },
            ],
        }

        # logger.info(f'{timezone.localtime(timezone.now())} - {self.request.user} connected.')
        return context


def lang_view(request):
    context = {
        "static_string_1": "first static string to translate",
        "static_string_2": "second static string to translate",
        "second_paragraph": "This is a second paragraph to translate",
    }
    return render(request, "lang.html", context)
