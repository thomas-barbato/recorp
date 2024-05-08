import datetime
import logging
from urllib import request

from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.contrib.messages import get_messages
from django.http import HttpResponse
from django.shortcuts import redirect
from django.template import RequestContext, loader
from django.urls import reverse, reverse_lazy
from django.utils.translation import gettext as _
from django.views.generic import TemplateView

from core.backend.get_data import GetMapDataFromDB
from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction
from core.forms import LoginForm
from core.models import Player, Sector
from recorp.settings import LOGIN_REDIRECT_URL

logger = logging.getLogger("django")


def admin_index(request):
    template = loader.get_template("admin/base_site.html")
    context = RequestContext(request, {})
    return HttpResponse(template.render(context))


class IndexView(TemplateView):
    form_class = LoginForm
    template_name = "index.html"
    redirect_authenticated_user = True

    def post(self, request, *args, **kwargs):
        data_to_send = {}
        url = self.request.path
        try:
            user = authenticate(
                self.request,
                username=request.POST.get("username"),
                password=request.POST.get("password"),
            )
            if user is not None and user.is_active and user.username != "npc":
                login(self.request, user)
                if Player.objects.filter(user_id=self.request.user.id).exists():
                    url = "/play/"
                else:
                    url = "/play/tutorial/"
                return redirect(url, data_to_send)
            unknown_user_msg = _(
                "Unable to login, username and or password are incorrects"
            )
            messages.error(self.request, unknown_user_msg)
            data_to_send = {"form": self.form_class}
            return redirect(url, data_to_send)
        except KeyError:
            warning_msg = _("Fill all fields to login")
            messages.warning(self.request, warning_msg)
            data_to_send = {"form": self.form_class}
            return redirect(url, data_to_send)


class DisplayTutorialView(LoginRequiredMixin, TemplateView):
    login_url = LOGIN_REDIRECT_URL
    redirect_field_name = "login_redirect"
    template_name = "tutorial.html"


class DisplayGameView(LoginRequiredMixin, TemplateView):
    login_url = LOGIN_REDIRECT_URL
    redirect_field_name = "login_redirect"
    template_name = "play.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context["loop"] = range(10)
        context["map_size_range"] = {"cols": range(20), "rows": range(15)}
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
        player = PlayerAction(self.request.user.id)
        if Sector.objects.filter(id=player.get_player_sector()).exists():
            data = StoreInCache(f"play_{player.get_player_sector()}", self.request.user).get_or_set_cache()
            result_dict = dict()
            for p in data["pc_npc"]:
                p["user"]["archetype_name"] = _(p["user"]["archetype_name"])

            data["sector"]["security"]["translated_name"] = _(
                data["sector"]["security"]["translated_name"]
            )
            
            data["sector"]["faction"]["translated_text_faction_level_starter"] = _(
                "The faction's main planet"
            )
            
            result_dict["actions"] = {
                "translated_action_label_msg": _("Actions available"),
                "translated_close_msg": _("Close"),
                "player_is_same_faction": player.get_player_faction() == data["sector"]["faction"]["id"]
            }
            
            for d in data["sector_element"]:
                d["data"]["type_translated"] = _(d["data"]["type"])
                d["data"]["description"] = _(d["data"]["description"])
                d["resource"]["translated_text_resource"] = _("Resources available"),
                d["resource"]["translated_quantity_str"] = _(d["resource"]["translated_quantity_str"])
                d["resource"]["translated_scan_msg_str"] = _("In order to display resource you must scan it. Scan's effect will last for a day")
                
            result_dict["sector"] = data["sector"]
            result_dict["sector_element"] = data["sector_element"]
            result_dict["pc_npc"] = data["pc_npc"]
            context["map_informations"] = result_dict
            return context
        else:
            error_msg = _("Sector unknown... Contact admin to get more informations")
            messages.warning(self.request, error_msg)
            data_to_send = {"form": LoginForm}
            return redirect("/play/", data_to_send)
