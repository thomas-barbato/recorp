import datetime
import logging
import urllib.request
from urllib import request
import json
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.views import LogoutView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.contrib.messages import get_messages
from django.contrib.messages.views import SuccessMessageMixin
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect, render, HttpResponse
from django.template import RequestContext, loader
from django.urls import reverse, reverse_lazy
from django.utils.translation import gettext as _
from django.views.generic import TemplateView, View, RedirectView, FormView
from django_user_agents.utils import get_user_agent
from django.http import JsonResponse
from core.backend.get_data import GetDataFromDB
from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction
from core.forms import LoginForm, SignupForm, PasswordRecoveryForm, CreateCharacterForm
from core.models import Player, Sector, Archetype
from recorp.settings import LOGIN_REDIRECT_URL


# logger = logging.getLogger("django")


def is_ajax(request):
    return request.META.get("HTTP_X_REQUESTED_WITH") == "XMLHttpRequest"


class JsonableResponseMixin:
    """
    Mixin to add JSON support to a form.
    Must be used with an object-based FormView (e.g. CreateView)
    """

    def form_invalid(self, form):
        """docstring"""
        if is_ajax(self.request):
            return JsonResponse(form.errors, status=400)
        return super().form_invalid(form)

    def form_valid(self, form):
        """docstring"""
        if is_ajax(self.request):
            data = {"message": "Successfully submitted form data."}
            return JsonResponse(data)
        return super().form_valid(form)


def admin_index(request):
    template = loader.get_template("admin/base_site.html")
    context = RequestContext(request, {})
    return HttpResponse(template.render(context))


class IndexView(TemplateView):
    form_class = LoginForm()
    template_name = "index.html"
    redirect_authenticated_user = True

    def post(self, request, *args, **kwargs):
        data_to_send = {}
        url = self.request.path
        print("ok")
        try:
            user = authenticate(
                self.request,
                username=request.POST.get("username"),
                password=request.POST.get("password"),
            )
            if user is not None and user.is_active and user.is_staff is False:
                login(self.request, user)
                player_id = PlayerAction(self.request.user).get_player_id()
                if player_id:
                    url = "/"
                    return redirect(url, data_to_send)
                else:
                    url = "play/create_character"
                    return redirect(url, data_to_send)
            elif user is not None and user.is_active and user.is_staff:
                pass

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


class CreateAccountView(SuccessMessageMixin, TemplateView):

    template_name: str = "create-account.html"
    success_url = reverse_lazy("index_view")

    def get(self, *args, **kwargs):
        if self.request.user.is_authenticated:
            return redirect("/")
        return super(CreateAccountView, self).get(*args, **kwargs)

    def get_context_data(self, *args, **kwargs):

        context = super(CreateAccountView, self).get_context_data(*args, **kwargs)
        context["form"] = SignupForm(self.request.POST or None)

        return context

    def post(self, request, *args, **kwargs):
        json_data = json.load(request)
        form = SignupForm(json_data)
        data = {}
        data["errors"] = []
        if json_data["password"] == json_data["password2"]:
            if form.is_valid():
                form.save()
                user = authenticate(
                    self.request,
                    username=json_data["username"],
                    password=json_data["password"],
                )
                if user is not None and user.is_active:
                    login(self.request, user)
                    url = "index_view"
                    msg_part_one = _(
                        "Your account has been successfully created with username"
                    )
                    msg_part_two = _("Click on <b>Enter</b> to create your character.")
                    msg = (
                        f"{msg_part_one} <b>{json_data['username']}</b> {msg_part_two}"
                    )
                    messages.success(self.request, msg)
                    return JsonResponse({}, status=200)

        for field, errors in form.errors.items():
            data["errors"].append(f"{field.split(' ')[0]}")

        response = data
        return JsonResponse(response, status=200)


class CreateCharacterView(LoginRequiredMixin, SuccessMessageMixin, TemplateView):
    login_url = LOGIN_REDIRECT_URL
    redirect_field_name = "login_redirect"
    form_class = CreateCharacterForm()
    template_name = "create-character.html"
    redirect_authenticated_user = True
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["factions"] = GetDataFromDB().get_faction_queryset()
        context["form"] = self.form_class
        context["archetype_data"] = Archetype.objects.values('name', 'id', 'data', 'ship_id__image', 'description', 'ship_id__ship_category_id__size')
        return context
    
    def post(self, request, **kwargs):
        print("ok dedans")
        print(self.request.POST)


class PasswordRecoveryView(FormView):
    form_class = PasswordRecoveryForm
    template_name = "password_recovery.html"
    success_url = "/"


class DisplayTutorialView(LoginRequiredMixin, TemplateView):
    login_url = LOGIN_REDIRECT_URL
    redirect_field_name = "login_redirect"
    template_name = "tutorial.html"


class DisplayGameView(LoginRequiredMixin, TemplateView):
    login_url = LOGIN_REDIRECT_URL
    redirect_field_name = "login_redirect"
    template_name = "play.html"
    
    def get(self, request, *args, **kwargs):
        player = PlayerAction(self.request.user.id)
        if player.is_player_exists() is False:
            url = "create_character"
            return HttpResponseRedirect(redirect_to=url)
        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        user_agent = self.request.user_agent
        player = PlayerAction(self.request.user.id)
        
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
                    d["resource"]["translated_text_resource"] = (
                        _("Resources available"),
                    )
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


class ChangeSectorGameView(LoginRequiredMixin, RedirectView):
    login_url = LOGIN_REDIRECT_URL
    redirect_field_name = "login_redirect"
    template_name = "play.html"

    def post(self, request, **kwargs):
        data = json.load(request)["data"]
        destination_sector, new_coordinates = PlayerAction(
            self.request.user.id
        ).player_travel_to_destination(data["warpzone_name"], data["source_id"])

        PlayerAction(self.request.user.id).set_player_sector(
            destination_sector, new_coordinates
        )
        store = StoreInCache(f"play_{destination_sector}", self.request.user.id)
        store.get_or_set_cache(need_to_be_recreated=True)


class LogoutView(LogoutView):
    http_method_names = ["post"]
    template_name = "index.html"

    def post(self, request):
        logout(request)
        try:
            session_key = PlayerAction(self.request.user).get_session_key()
            del request.session[session_key]
            request.session.modified = True
        except KeyError:
            pass
        return HttpResponseRedirect(LOGIN_REDIRECT_URL)
