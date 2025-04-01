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
from django_user_agents.utils import get_user_agent

from core.backend.get_data import GetDataFromDB
from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction
from core.forms import LoginForm
from core.models import Player, Sector
from recorp.settings import LOGIN_REDIRECT_URL

# logger = logging.getLogger("django")


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

        user_agent = self.request.user_agent
        if user_agent.is_pc:
            map_range = GetDataFromDB.get_resolution_sized_map("is_pc")
        elif user_agent.is_mobile:
            map_range = GetDataFromDB.get_resolution_sized_map("is_mobile")
        elif user_agent.is_tablet:
            map_range = GetDataFromDB.get_resolution_sized_map("is_tablet")

        context["loop"] = range(10)
        context["map_size_range"] = {"cols": range(40), "rows": range(40)}

        context["skills"] = {
            "categories": [
                "Steering",
                "Offensive",
                "Defensive",
                "Utility",
                "Industry",
            ],
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
            ],
        }
        player = PlayerAction(self.request.user.id)
        if Sector.objects.filter(id=player.get_player_sector()).exists():
            data = StoreInCache(
                f"play_{player.get_player_sector()}", self.request.user
            ).get_or_set_cache()
            result_dict = dict()
            for p in data["pc"]:
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
                "player_is_same_faction": player.get_player_faction()
                == data["sector"]["faction"]["id"],
                "translated_scan_msg_str": _(
                    "In order to display resource you must scan it"
                ),
                "translated_statistics_msg_str": _(
                    "Equip your spaceship with the ‘spaceship probe’ module to access detailed statistics"
                ),
                "translated_statistics_msg_label": _("statistics"),
            }

            for d in data["sector_element"]:
                d["data"]["type_translated"] = _(d["data"]["type"])
                d["data"]["description"] = _(d["data"]["description"])
                if d["data"]["type"] != "warpzone":
                    d["resource"]["translated_text_resource"] = (_("Resources available"),)
                    d["resource"]["translated_quantity_str"] = _(
                        d["resource"]["translated_quantity_str"]
                    )

            result_dict["sector"] = data["sector"]
            result_dict["sector_element"] = data["sector_element"]
            result_dict["pc"] = data["pc"]
            result_dict["npc"] = data["npc"]
            result_dict["screen_sized_map"] = map_range
            context["map_informations"] = result_dict
            return context
        else:
            error_msg = _("Sector unknown... Contact admin to get more informations")
            messages.warning(self.request, error_msg)
            data_to_send = {"form": LoginForm}
            return redirect("/", data_to_send)
