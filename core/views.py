import datetime
import logging
import urllib.request
from urllib import request
import json
import os
from io import BytesIO
import cairosvg
from django.core.files import File
from django.conf import settings
from PIL import Image
from pathlib import Path
from django.db import models
from django.core.paginator import Paginator
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.auth.decorators import login_required
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
from django.utils import timezone
from django.views.generic import TemplateView, View, RedirectView, FormView
from django.views.decorators.http import require_http_methods
from django_user_agents.utils import get_user_agent
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import render, get_object_or_404
from django.db.models import Q
from core.backend.tiles import UploadThisImage
from core.backend.get_data import GetDataFromDB
from core.backend.store_in_cache import StoreInCache
from core.backend.player_actions import PlayerAction
from core.forms import LoginForm, SignupForm, PasswordRecoveryForm, CreateCharacterForm
from core.models import (
    LoggedInUser,
    Player,
    Sector,
    Archetype,
    Ship,
    PlayerShip,
    ArchetypeModule,
    Skill,
    SkillExperience,
    PlayerShipModule,
    PlayerSkill,
    Module,
    PrivateMessage,
    PrivateMessageRecipients,
    PlayerGroup,
    Message,
    MessageReadStatus

)
from recorp.settings import LOGIN_REDIRECT_URL, BASE_DIR


logger = logging.getLogger("django")


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
        try:
            user = authenticate(
                self.request,
                username=request.POST.get("username"),
                password=request.POST.get("password"),
            )
            if user is not None and user.is_active and user.is_staff is False:
                login(self.request, user)
                player_id = PlayerAction(self.request.user).get_player_id()
                LoggedInUser.objects.get_or_create(
                    user=user,
                    defaults={'session_key': self.request.session.session_key}
                )
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
                    
                    LoggedInUser.objects.get_or_create(
                        user=user,
                        defaults={'session_key': self.request.session.session_key}
                    )
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

class CreateAccountView(TemplateView):
    template_name = "create-account.html"

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("/")
        return render(request, self.template_name, {"form": SignupForm()})

    def post(self, request, *args, **kwargs):
        if request.content_type == "application/json":
            import json
            payload = json.loads(request.body.decode("utf-8") or "{}")
        else:
            payload = request.POST

        form = SignupForm(payload)

        # Vérification mot de passe
        if payload.get("password") != payload.get("password2"):
            if is_ajax(request):
                return JsonResponse({"errors": ["password2"]}, status=400)
            messages.error(request, _("Passwords do not match"))
            return render(request, self.template_name, {"form": form})

        if not form.is_valid():
            error_fields = list(form.errors.keys())
            if is_ajax(request):
                return JsonResponse({"errors": error_fields}, status=400)
            messages.error(request, _("Please correct the errors below"))
            return render(request, self.template_name, {"form": form})

        # Création de l'utilisateur **sans login**
        user = form.save()
        messages.success(
            request,
            _("Your account has been successfully created. Please log in to continue."),
        )

        if is_ajax(request):
            return JsonResponse({"success": True, "redirect_url": "/"}, status=200)

        return redirect("/")


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
        context["archetype_data"] = Archetype.objects.values('name', 'id', 'data', 'ship_id__image', 'description')
        context["archetype_modules"] = ArchetypeModule.objects.values('archetype_id', 'module_id__name', 'module_id__type', 'module_id__effect')
        return context
    
    def post(self, request, **kwargs):
        if request.POST.get('name') and request.POST.get('faction'):
            data = {
                'name' : request.POST.get('name'),
                'faction': request.POST.get('faction'),
                'archetype': request.POST.get('archetype'),
                'image': request.POST.get('id_image'),
                'description': request.POST.get('description'),
                'user' : self.request.user.id,
                'in_tutoriel_zone': True,
            }
            
            form = CreateCharacterForm(data, request.FILES)
            if form.is_valid():
                contains_image = True if request.FILES.get('file') else False
                new_player = Player(
                    name=data["name"],
                    faction_id=data["faction"],
                    archetype_id=data["archetype"],
                    image=contains_image,
                    sector_id=Sector.objects.filter(name__contains="tuto").values_list('id', flat=True),
                    coordinates = {"x" : 15, "y": 15 },
                    description=data["description"],
                    user_id=self.request.user.id
                )
                
                try:
                    new_player.save()
                except Exception as e:
                    print("Erreur au save du Player:", e)
                    
                archetype_module_list = [e for e in ArchetypeModule.objects.filter(archetype_id=int(data["archetype"])).values('module_id', 'module_id__type', 'module_id__name', 'module_id__effect', 'module_id__type')]
                module_list = [e['module_id'] for e in archetype_module_list]
                archetype_data = [e for e in Archetype.objects.filter(id=data["archetype"]).values('ship_id', 'data')]
                
                default_ship_values = Ship.objects.filter(id=archetype_data[0]['ship_id']).values(
                    'default_hp',
                    'default_movement',
                    'default_ballistic_defense',
                    'default_thermal_defense',
                    'default_missile_defense'
                )[0]
                
                current_hp = default_ship_values['default_hp']
                max_hp = default_ship_values['default_hp']
                current_movement = default_ship_values['default_movement']
                current_ballistic_defense = default_ship_values['default_ballistic_defense']
                current_thermal_defense = default_ship_values['default_thermal_defense']
                current_missile_defense = default_ship_values['default_missile_defense']
                max_ballistic_defense = default_ship_values['default_ballistic_defense']
                max_thermal_defense = default_ship_values['default_thermal_defense']
                max_missile_defense = default_ship_values['default_missile_defense']
                max_movement = default_ship_values['default_movement']
                current_cargo_size = 3
                        
                for module in archetype_module_list:
                    if "DEFENSE" in module["module_id__type"]:
                        if "BALLISTIC" in module["module_id__type"]:
                            current_ballistic_defense += module["module_id__effect"]["defense"]
                            max_ballistic_defense += module["module_id__effect"]["defense"]
                        elif "THERMAL" in module["module_id__type"]:
                            current_thermal_defense += module["module_id__effect"]["defense"]
                            max_thermal_defense += module["module_id__effect"]["defense"]
                        elif "MISSILE" in module["module_id__type"]:
                            current_missile_defense += module["module_id__effect"]["defense"]
                            max_missile_defense += module["module_id__effect"]["defense"]
                    elif "MOVEMENT" in module["module_id__type"]:
                        current_movement += module["module_id__effect"]['movement']
                        max_movement += module["module_id__effect"]['movement']
                    elif "HULL" in module["module_id__type"]:
                        current_hp += module["module_id__effect"]['hp']
                        max_hp += module["module_id__effect"]['hp']
                    elif "HOLD" in module["module_id__type"]:
                        current_cargo_size += module["module_id__effect"]['capacity']
                try:
                    PlayerShip.objects.create(
                        is_current_ship=True,
                        is_reversed=False,
                        current_hp=current_hp,
                        max_hp=current_hp,
                        current_cargo_size=current_cargo_size,
                        current_movement=current_movement,
                        max_movement=current_movement,
                        current_missile_defense=current_missile_defense,
                        current_ballistic_defense=current_ballistic_defense,
                        current_thermal_defense=current_thermal_defense,
                        max_missile_defense=max_missile_defense,
                        max_ballistic_defense=max_ballistic_defense,
                        max_thermal_defense=max_thermal_defense,
                        status="FULL",
                        player_id=new_player.id,
                        ship_id=archetype_data[0]['ship_id']
                    )
                    
                except Exception as e:
                    print("Erreur au save du PlayerShip:", e)
                    
                new_player_ship_id = PlayerShip.objects.filter(
                        is_current_ship=True,
                        is_reversed=False,
                        current_hp=current_hp,
                        max_hp=current_hp,
                        current_cargo_size=current_cargo_size,
                        current_movement=current_movement,
                        max_movement=current_movement,
                        current_missile_defense=current_missile_defense,
                        current_ballistic_defense=current_ballistic_defense,
                        current_thermal_defense=current_thermal_defense,
                        max_missile_defense=max_missile_defense,
                        max_ballistic_defense=max_ballistic_defense,
                        max_thermal_defense=max_thermal_defense,
                        status="FULL",
                        player_id=new_player.id,
                        ship_id=archetype_data[0]['ship_id']).values_list('id', flat=True)[0]
                
                for id in module_list:
                    PlayerShipModule.objects.create(
                        module_id=id,
                        player_ship_id=new_player_ship_id
                    )
                
                skill_list = [e for e in Skill.objects.values('id', 'name')]
                
                for skill in skill_list:
                    skill_name = skill['name']
                    skill_id = skill['id']
                    skill_level = 0
                    
                    if archetype_data[0]['data'].get(skill_name):
                        skill_level = archetype_data[0]['data'][skill_name]
                        
                    PlayerSkill.objects.create(
                        level = skill_level,
                        progress = 0.0,
                        player_id = new_player.id,
                        skill_id = skill_id
                    )
                
                if contains_image is True:
                    
                    upload_file = UploadThisImage(request.FILES.get('file'), "users", new_player.id, new_player.id)
                    upload_file.save()
                    
                else:
                    # PILE can't read .svg, so we transform this img in png.
                    default_svg = os.path.join(settings.STATIC_ROOT, 'img', 'ux', 'default-user.svg')
                    png_bytes = cairosvg.svg2png(url=default_svg)

                    tmp_file = BytesIO(png_bytes)
                    tmp_file.name = 'default.png'

                    upload_file = UploadThisImage(tmp_file, "users", new_player.id, new_player.id)
                    upload_file.save()
                    
                
            else:
                print(form.errors)


class PasswordRecoveryView(FormView):
    form_class = PasswordRecoveryForm
    template_name = "password_recovery.html"
    success_url = "/"


class DisplayTutorialView(LoginRequiredMixin, TemplateView):
    login_url = LOGIN_REDIRECT_URL
    redirect_field_name = "login_redirect"
    template_name = "tutorial.html"
    
class DisplayGameOldView(LoginRequiredMixin, TemplateView):
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
        modules_category = [e for e in Module.objects.values_list('type', flat=True).distinct()]
        
        if user_agent.is_pc:
            map_range = GetDataFromDB.get_resolution_sized_map("is_pc")
        elif user_agent.is_mobile:
            map_range = GetDataFromDB.get_resolution_sized_map("is_mobile")
        elif user_agent.is_tablet:
            map_range = GetDataFromDB.get_resolution_sized_map("is_tablet")

        context["loop"] = range(10)
        context["map_size_range"] = {"cols": range(40), "rows": range(40)}
        
        sector = Sector.objects.filter(id=player.get_player_sector())
        sector_name = sector.values_list("name", flat=True)[0]

        if sector.exists():
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
                        "id": skill['id'],
                        "skill_name": skill['skill_id__name'],
                        "level": skill['level'],
                        "progress": str(skill['progress']).replace(',', '.'),
                        "cat": skill['skill_id__category'],
                        "description": skill['skill_id__description'],
                    } for skill in PlayerSkill.objects.filter(player_id=player.get_player_id()).values(
                            'id', 
                            'level', 
                            'progress', 
                            'skill_id__name', 
                            'skill_id__category', 
                            'skill_id__description'
                        )
                ],
            }
            
            data = StoreInCache(
                f"play_{player.get_player_sector()}", self.request.user
            ).get_or_set_cache()
            
            result_dict = dict()
            for pc in data["pc"]:
                pc["user"]["archetype_name"] = _(pc["user"]["archetype_name"])

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
            
            result_dict["sector"] = data["sector"]
            result_dict["sector_element"] = data["sector_element"]
            result_dict["pc"] = data["pc"]
            result_dict["npc"] = data["npc"]
            result_dict["screen_sized_map"] = map_range
            context["map_informations"] = result_dict
            context["current_player_id"] = player.get_player_id()
            context["module_categories"] = modules_category
            return context
        
        else:
            
            error_msg = _("Sector unknown... Contact admin to get more informations")
            messages.warning(self.request, error_msg)
            data_to_send = {"form": LoginForm}
            return redirect("/", data_to_send)
        

class DisplayGameView(LoginRequiredMixin, TemplateView):
    login_url = LOGIN_REDIRECT_URL
    redirect_field_name = "login_redirect"
    template_name = "play_canvas.html"
    
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
        modules_category = [e for e in Module.objects.values_list('type', flat=True).distinct()]
        
        if user_agent.is_pc:
            map_range = GetDataFromDB.get_resolution_sized_map("is_pc")
        elif user_agent.is_mobile:
            map_range = GetDataFromDB.get_resolution_sized_map("is_mobile")
        elif user_agent.is_tablet:
            map_range = GetDataFromDB.get_resolution_sized_map("is_tablet")

        context["loop"] = range(10)
        context["map_size_range"] = {"cols": range(40), "rows": range(40)}

        if Sector.objects.filter(id=player.get_player_sector()).exists():
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
                        "id": skill['id'],
                        "skill_name": skill['skill_id__name'],
                        "level": skill['level'],
                        "progress": str(skill['progress']).replace(',', '.'),
                        "cat": skill['skill_id__category'],
                        "description": skill['skill_id__description'],
                    } for skill in PlayerSkill.objects.filter(player_id=player.get_player_id()).values(
                            'id', 
                            'level', 
                            'progress', 
                            'skill_id__name', 
                            'skill_id__category', 
                            'skill_id__description'
                        )
                ],
            }
            
            data = StoreInCache(
                f"play_{player.get_player_sector()}", self.request.user
            ).get_or_set_cache()
            
            result_dict = dict()
            for pc in data["pc"]:
                pc["user"]["archetype_name"] = _(pc["user"]["archetype_name"])

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
            
            result_dict["sector"] = data["sector"]  
            result_dict["sector_element"] = data["sector_element"]
            result_dict["pc"] = data["pc"]
            result_dict["npc"] = data["npc"]
            result_dict["room"] = player.get_player_sector()
            result_dict["screen_sized_map"] = map_range
            context["map_informations"] = result_dict
            context["current_player_id"] = player.get_player_id()
            context["module_categories"] = modules_category
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

@require_http_methods(["GET"])
def session_check(request):
    """Vérifie si la session est toujours active."""
    if request.user.is_authenticated:
        # Rafraîchir la session
        request.session.modified = True
        return JsonResponse({'authenticated': True})
    return JsonResponse({'authenticated': False}, status=401)


@login_required
def private_mail_modal(request):
    page_number = request.GET.get('page', 1)
    tab = request.GET.get('tab', 'received')
    player_id = PlayerAction(request.user.id).get_player_id()
    mp = []
    
    if tab == "sent":
        messages_qs = PrivateMessageRecipients.objects.filter(message_id__sender_id=player_id, deleted_at__isnull=True, is_author=True).values(
            'message_id__sender_id__name',
            'message_id__sender_id',
            'message_id__subject',
            'message_id__body',
            'message_id__timestamp',
            'message_id__sender_id__faction_id__name',
            'message_id',
        ).order_by('-message_id__timestamp')
        mp = [{
                'id': e['message_id'],
                'user': e['message_id__sender_id'],
                'name': e['message_id__sender_id__name'],
                'subject': e['message_id__subject'],
                'body': e['message_id__body'],
                'timestamp': e['message_id__timestamp'],
                'avatar_url': f"img/users/{e['message_id__sender_id']}/0.gif",
                'faction': e['message_id__sender_id__faction_id__name'],
                'faction_color': GetDataFromDB.get_faction_badge_color_class(e['message_id__sender_id__faction_id__name']),
                'is_author': True,
        } for e in messages_qs]
    else:
        messages_qs = PrivateMessageRecipients.objects.filter(recipient_id=player_id, is_author=False, deleted_at__isnull=True).values(
            'message_id__sender_id__name',
            'message_id__sender_id',
            'message_id__subject',
            'message_id__body',
            'message_id__timestamp',
            'message_id__sender_id__faction_id__name',
            'message_id',
            'is_read'
        ).order_by('-message_id__timestamp')
        mp = [{
                'id': e['message_id'],
                'user': e['message_id__sender_id'],
                'name': e['message_id__sender_id__name'],
                'subject': e['message_id__subject'],
                'body': e['message_id__body'],
                'timestamp': e['message_id__timestamp'],
                'avatar_url': f"img/users/{e['message_id__sender_id']}/0.gif",
                'faction': e['message_id__sender_id__faction_id__name'],
                'faction_color': GetDataFromDB().get_faction_badge_color_class(e['message_id__sender_id__faction_id__name']),
                'is_read': e['is_read'],
                'is_author': False
        } for e in messages_qs]
    
    paginator = Paginator(mp, 4)
    page_obj = paginator.get_page(page_number)

    context = {
        "received_messages": page_obj.object_list,
        "page_obj": page_obj,
        "has_previous": page_obj.has_previous(),
        "has_next": page_obj.has_next(),
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
    }
    return render(request, "mail-list.html", context)


@login_required
def get_private_mail(request, pk):
    try:
        player_id = PlayerAction(request.user.id).get_player_id()
        message = PrivateMessage.objects.filter(id=pk, deleted_at__isnull=True)
        data = {}
        
        if not message:
            return
        
        if not player_id:
            return
        
        message_author = [e for e in message.values(
            'id', 'subject', 'body', 'sender_id__name', 'timestamp', 'sender_id'
        )]
        
        message_recipients = [e for e in PrivateMessageRecipients.objects.filter(
                message_id=pk, 
                recipient_id=player_id, 
                deleted_at__isnull=True
                ).values(
                'message_id', 'message_id__subject', 'message_id__body',
                'message_id__sender_id__name', 'message_id__timestamp',
                'message_id__sender_id', 'message_id__sender_id', 
                'message_id__sender_id__faction_id__name'
                )
            ]
            
        if not message_author and not message_recipients:
            return JsonResponse({"error": _("Access denied")}, status=403)
        
        id = f'{message_recipients[0]["message_id"] if message_recipients else message_author[0]["id"]}'
        subject = f'{message_recipients[0]["message_id__subject"] if message_recipients else message_author[0]["subject"]}'
        sender = f'{message_recipients[0]["message_id__sender_id__name"] if message_recipients else message_author[0]["sender_id__name"]}'
        sender_id = f'{message_recipients[0]["message_id__sender_id"] if message_recipients else message_author[0]["sender_id"]}' 
        body = f'{message_recipients[0]["message_id__body"] if message_recipients else message_author[0]["body"]}'
        timestamp = f'{message_recipients[0]["message_id__timestamp"].strftime("%Y-%m-%d %H:%M:%S") if message_recipients else message_author[0]["timestamp"].strftime("%Y-%m-%d %H:%M:%S")}'
        is_author = PrivateMessage.objects.filter(id=pk, sender_id=player_id).exists()
        data = {
            "id": id,
            "subject": subject,
            'sender': sender,
            'sender_id': sender_id,
            "body": body,
            "timestamp": timestamp,
            "is_author": is_author,
        }
        
        if message_recipients:
            PrivateMessageRecipients.objects.filter(message_id=data['id'], recipient_id=player_id, deleted_at__isnull=True).update(is_read=True)
        
        return JsonResponse(data, status=200)
    
    except Exception as e:
        return JsonResponse({}, status=500)


@login_required
def delete_private_mail(request):
    if request.method != "POST":
        return HttpResponseBadRequest(_("Invalid method"))
    try:
        data = json.loads(request.body)
        message_id = data.get('id')
        
        player_id = PlayerAction(request.user.id).get_player_id()
        messageRecipient = PrivateMessageRecipients.objects.filter(message_id=message_id, recipient_id=player_id, deleted_at__isnull=True)
        
        if not messageRecipient:
            return JsonResponse({})
        
        if not player_id:
            return JsonResponse({})
        
        messageRecipient.update(
            deleted_at=datetime.datetime.now()
        )
        
        if PrivateMessageRecipients.objects.filter(message_id=message_id, deleted_at__isnull=True).exists() is False:
            PrivateMessage.objects.filter(id=message_id).update(
                deleted_at=datetime.datetime.now()
            )
            
        return JsonResponse({}, status=200)
        
    except Exception as e:
        return JsonResponse({"error": _("Message not found.")}, status=404)


@login_required
def search_private_mail(request):
    query = request.GET.get("q", "")
    results = PrivateMessage.objects.filter(
        recipients=request.user, subject__icontains=query
    )[:20]
    return render(request, "mail-list.html", {"received_messages": results})


@login_required
def search_players_for_private_mail(request):
    """
    Retourne jusqu'à 10 joueurs correspondant à la query.
    Résultat JSON: [{id, name, faction}]
    """
    q = request.GET.get('q', '').strip()
    results = []
    if q:
        qs = Player.objects.filter(
            Q(name__icontains=q),
            is_npc=False
        ).select_related('faction')[:10]
        for p in qs:
            results.append({
                "id": p.id,
                "name": p.name,
                "faction": p.faction.name if p.faction else "",
            })
    return JsonResponse({"results": results})

@login_required
def get_unread_private_mail_count(request):
    """Retourne le nombre de messages non lus"""
    try:
        player = Player.objects.get(user=request.user)
        
        unread_count = PrivateMessageRecipients.objects.filter(
            recipient=player,
            is_read=False,
            is_author=False,  # Ne pas compter ses propres messages
            deleted_at__isnull=True
        ).count()
        
        return JsonResponse({"unread_count": unread_count})
        
    except Player.DoesNotExist:
        return JsonResponse({"error": "Player not found"}, status=404)
    except Exception as e:
        logger.exception(f"Erreur get_unread_messages_count: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def mark_private_mail_as_read(request, message_id):
    """Marque un message comme lu"""
    try:
        player = Player.objects.get(user=request.user)
        
        recipient_entry = PrivateMessageRecipients.objects.get(
            message_id=message_id,
            recipient=player
        )
        
        if not recipient_entry.is_read:
            recipient_entry.is_read = True
            recipient_entry.save(update_fields=['is_read', 'updated_at'])
        
        return JsonResponse({"success": True})
        
    except PrivateMessageRecipients.DoesNotExist:
        return JsonResponse({"error": "Message not found"}, status=404)
    except Exception as e:
        logger.exception(f"Erreur mark_message_as_read: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@login_required
def get_chat_messages(request, channel_type):
    player = Player.objects.select_related("faction", "sector").get(user=request.user)
    messages_data = []
    
    # Date limite
    cutoff_date = player.last_time_warpzone
    channel_upper = channel_type.upper()

    if channel_type == "sector":
        messages = Message.objects.filter(
            channel=channel_upper,
            sector=player.sector,
            created_at__gte=cutoff_date
        ).select_related("author__faction").order_by("-created_at")[:50]

    elif channel_type == "faction":
        messages = Message.objects.filter(
            channel=channel_upper,
            faction=player.faction,
            created_at__gte=cutoff_date
        ).select_related("author__faction").order_by("-created_at")[:50]

    elif channel_type == "group":
        groups = PlayerGroup.objects.filter(player=player).values_list("group_id", flat=True)
        messages = Message.objects.filter(
            channel=channel_upper,
            group_id__in=groups,
            created_at__gte=cutoff_date
        ).select_related("author__faction").order_by("-created_at")[:50]
    else:
        return JsonResponse({"error": "Invalid chat type"}, status=400)
    
    message_ids = [msg.id for msg in messages]
    read_statuses = MessageReadStatus.objects.filter(
        player=player,
        message_id__in=message_ids
    ).values_list('message_id', flat=True)
    
    read_message_ids = set(read_statuses)

    for msg in reversed(messages):
        messages_data.append({
            "id": msg.id,
            "author": msg.author.name,
            "faction": msg.author.faction.name if msg.author.faction else "",
            "faction_color": GetDataFromDB().get_faction_badge_color_class(msg.author.faction.name) if msg.author.faction else "",
            "content": msg.content,
            "timestamp": msg.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "is_read": msg.id in read_message_ids
        })

    return JsonResponse({"messages": messages_data})


@login_required
def mark_messages_as_read(request, channel_type):
    """Marque tous les messages d'un canal comme lus"""
    try:
        player = Player.objects.get(user=request.user)
        channel_upper = channel_type.upper()
        cutoff_date = player.last_time_warpzone

        # Récupérer les messages non lus selon le canal
        if channel_type == "sector":
            messages = Message.objects.filter(
                channel=channel_upper,
                sector=player.sector,
                created_at__gte=cutoff_date
            )
        elif channel_type == "faction":
            messages = Message.objects.filter(
                channel=channel_upper,
                faction=player.faction,
                created_at__gte=cutoff_date
            )
        elif channel_type == "group":
            groups = PlayerGroup.objects.filter(player=player).values_list("group_id", flat=True)
            messages = Message.objects.filter(
                channel=channel_upper,
                group_id__in=groups,
                created_at__gte=cutoff_date
            )
        else:
            return JsonResponse({"error": "Invalid channel"}, status=400)
        
        # Marquer comme lus
        MessageReadStatus.objects.filter(
            player=player,
            message__in=messages,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())

        return JsonResponse({"success": True})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@login_required
def get_unread_counts(request):
    """Retourne le nombre de messages non lus par canal"""
    try:
        player = Player.objects.select_related("faction", "sector").get(user=request.user)
        cutoff_date = player.last_time_warpzone

        unread_counts = {
            "sector": 0,
            "faction": 0,
            "group": 0
        }

        # Secteur
        unread_counts["sector"] = MessageReadStatus.objects.filter(
            player=player,
            is_read=False,
            message__channel="SECTOR",
            message__sector=player.sector,
            message__created_at__gte=cutoff_date
        ).count()

        # Faction
        unread_counts["faction"] = MessageReadStatus.objects.filter(
            player=player,
            is_read=False,
            message__channel="FACTION",
            message__faction=player.faction,
            message__created_at__gte=cutoff_date
        ).count()

        # Groupe
        groups = PlayerGroup.objects.filter(player=player).values_list("group_id", flat=True)
        unread_counts["group"] = MessageReadStatus.objects.filter(
            player=player,
            is_read=False,
            message__channel="GROUP",
            message__group_id__in=groups,
            message__created_at__gte=cutoff_date
        ).count()

        return JsonResponse(unread_counts)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)