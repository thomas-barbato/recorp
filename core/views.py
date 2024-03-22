import logging
import datetime
from urllib import request

from django.urls import reverse_lazy, reverse

from core.forms import LoginForm
from django.contrib.auth.mixins import LoginRequiredMixin
from django.template import RequestContext, loader
from django.shortcuts import render, redirect
from django.utils import timezone
from django.contrib.auth import login, authenticate
from django.utils.translation import gettext as _
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.views.generic import TemplateView, RedirectView, FormView
from core.backend.get_data import GetMapDataFromDB
from core.models import (
    Sector,
    Player,
    User
)
logger = logging.getLogger("django")


def admin_index(request):
    template = loader.get_template("admin/base_site.html")
    context = RequestContext(request, {})
    return HttpResponse(template.render(context))


class IndexView(FormView):
    form_class = LoginForm
    template_name = "index.html"
    redirect_authenticated_user = True
    success_message = (
        '<div class="alert alert-success text-center col-xl-12 col-md-12 col-sm-10 mt-1" role="alert">'
        "<p>"+_('You are now logged on')+".</p>"
        "</div>"
    )

    def get_success_message(self, cleaned_data=""):
        return self.success_message

    def form_valid(self, form):
        username = self.request.POST.get("username")
        user = authenticate(
            self.request,
            username=username,
            password=self.request.POST.get("password"),
        )
        if user is not None:
            login(self.request, user)
            if Player.objects.filter(id=self.request.user.id).exists():
                return redirect('/play/')
            return redirect('/play/tutorial/')

    def form_invalid(self, form):
        form = {"form": form}
        return redirect(self.request.path, form)


class DisplayTutorialView(LoginRequiredMixin, TemplateView):
    login_url = "/"
    redirect_field_name = "login_redirect"
    template_name = "tutorial.html"


class DisplayGameView(LoginRequiredMixin, TemplateView):
    login_url = "/"
    redirect_field_name = "login_redirect"
    template_name = "play.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        print(self.request.user)
        if self.request.user.is_anonymous:
            user = User.objects.get(id=1)
            print(user)
        context["france"] = timezone.localtime(timezone.now())
        context["now"] = datetime.datetime.now()
        context["loop"] = range(10)
        context["map_size_range"] = {"cols": range(20), "rows": range(15)}
        context["description"] = (
            "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident"
        )
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
        pk = 15
        if Sector.objects.filter(id=pk).exists():
            sector = Sector.objects.get(id=pk)
            planets, asteroids, stations = GetMapDataFromDB.get_items_from_sector(pk)
            table_set = {"planet": planets, "asteroid": asteroids, "station": stations}
            result_dict = dict()
            result_dict["pc_npc"] = [
                p
                for p in Player.objects.filter(sector_id=pk).values(
                    "id", "name", "coordinates", "image", "description", "is_npc"
                )
            ]
            result_dict["sector"] = {
                "id": pk,
                "name": sector.name,
                "description": sector.description,
                "image": sector.image,
                "security_id": sector.security_id,
                "security_name": sector.security.name,
                "faction_name": sector.faction.name,
                "faction_id": sector.faction_id,
                "is_faction_level_starter": sector.is_faction_level_starter,
            }

            result_dict["sector_element"] = []

            for table_key, table_value in table_set.items():
                for table in table_value:
                    size = GetMapDataFromDB.get_specific_size(table_key)
                    element, _ = GetMapDataFromDB.get_table(table_key)
                    map_element = [
                        v
                        for k, v in element.objects.filter(name=table.source.name)
                        .values_list("data", flat=True)[0]
                        .items()
                        if v != "none"
                    ]

                    result_dict["sector_element"].append(
                        {
                            "type": table_key,
                            "item_id": table.id,
                            "item_name": table.data["name"],
                            "resource_id": table.resource_id,
                            "source_id": table.source_id,
                            "sector_id": table.sector_id,
                            "animations": map_element,
                            "data": table.data,
                            "size": size,
                        }
                    )
            context["map_informations"] = result_dict
        # logger.info(f'{timezone.localtime(timezone.now())} - {self.request.user} connected.')
        return context
