import os
import re
import json
from django.contrib import admin
from django.core import serializers
from django.core.serializers import serialize
from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic.edit import FormMixin
from django.contrib import messages
from recorp.settings import BASE_DIR
from core.backend.tiles import CropThisImage
from core.backend.get_data import GetMapDataFromDB
from django.views.generic import TemplateView
from core.forms import CropImageForm
from core.views import admin_index
from core.models import (
    User,
    CashShop,
    UserPurchase,
    Resource,
    Planet,
    Station,
    Asteroid,
    Faction,
    Player,
    Skill,
    SkillEffect,
    Recipe,
    Research,
    Log,
    ShipCategory,
    Ship,
    ModuleEffect,
    Module,
    PlayerLog,
    PlayerResource,
    PlayerRecipe,
    PlayerSkillEffect,
    PlayerResearch,
    PlayerPrivateMessage,
    PlayerShip,
    PlayerShipModule,
    PlayerShipResource,
    FactionLeader,
    FactionResource,
    FactionRank,
    PlanetResource,
    AsteroidResource,
    StationResource,
    Sector,
)


class CustomAdminSite(admin.AdminSite):
    site_header = "recorp-admin"
    site_title = "recorp-admin"

    def get_app_list(self, request):
        app_list = super().get_app_list(request)
        app_list += [
            {
                "name": "My Custom App",
                "app_label": "my_test_app",
                # "app_url": "/admin/test_view",
                "models": [
                    {
                        "name": "crop image and upload",
                        "object_name": "crop image and upload",
                        "admin_url": "/admin/crop_image",
                        "view_only": True,
                    },
                    {
                        "name": "create foreground item",
                        "object_name": "create foreground item",
                        "admin_url": "/admin/create_foreground_item/",
                        "view_only": True,
                    },
                    {
                        "name": "create map",
                        "object_name": "create map",
                        "admin_url": "/admin/create_map",
                        "view_only": True,
                    },
                ],
            }
        ]
        return app_list

    def get_urls(self):
        from django.urls import re_path

        urls = super(CustomAdminSite, self).get_urls()
        # Note that custom urls get pushed to the list (not appended)
        # This doesn't work with urls += ...
        urls = [
            re_path(r"^my_view/$", self.admin_view(admin_index)),
            re_path(
                r"^crop_image/$",
                self.admin_view(CropImageView.as_view()),
                name="crop-image",
            ),
            re_path(
                r"^create_foreground_item/$",
                self.admin_view(CreateForegroundItemView.as_view()),
                name="create-foreground-item",
            ),
            re_path(
                r"^create_map/$",
                self.admin_view(CreateMapView.as_view()),
                name="create-map",
            ),
        ] + urls
        return urls


class CropImageView(TemplateView):
    template_name = "crop_image.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context["form"] = CropImageForm
        return context

    def post(self, request):
        form = CropImageForm(request.POST, request.FILES)
        if form.is_valid():
            category = form.cleaned_data.get("category")
            type = form.cleaned_data.get("type")
            img = request.FILES["img_input"]
            file_directory_name = form.cleaned_data.get("file_directory_name")
            CropThisImage(img, category, type, file_directory_name).crop_and_save()
            messages.success(self.request, "Success")
        return HttpResponseRedirect(request.path)


class CreateForegroundItemView(TemplateView):
    template_name = "create_foreground_item.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context["item_choice"] = ["planet", "asteroid", "station"]
        context["planet_url"] = GetMapDataFromDB.get_fg_element_url("planet")
        context["station_url"] = GetMapDataFromDB.get_fg_element_url("station")
        context["asteroid_url"] = GetMapDataFromDB.get_fg_element_url("asteroid")
        context["size"] = GetMapDataFromDB.get_size()
        return context

    def post(self, request):
        select_type = ["planet", "asteroid", "station"]
        selected = request.POST.get('item-type-choice-section')
        if selected in select_type:
            fg_name = re.sub(r'\W', '', request.POST.get('foreground-item-name'))
            if len(fg_name) == 0:
                fg_name = "Default value name"
            data = {
                "animation_1": request.POST.get('animation-1'),
                "animation_2": request.POST.get('animation-2'),
                "animation_3": request.POST.get('animation-3'),
                "animation_4": request.POST.get('animation-4'),
            }
            match selected:
                case "planet":
                    size = {"size_x": 4, "size_y": 4}
                    Planet.objects.create(name=fg_name, data=data, size=size)
                case "asteroid":
                    size = {"size_x": 1, "size_y": 1}
                    Asteroid.objects.create(name=fg_name, data=data, size=size)
                case "station":
                    size = {"size_x": 3, "size_y": 3}
                    Station.objects.create(name=fg_name, data=data, size=size)
                case _:
                    pass
            messages.success(self.request, f"{fg_name}({selected}) created with success")
        return HttpResponseRedirect(request.path)


class CreateMapView(TemplateView):
    template_name = "create_map.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context["map_size_range"] = GetMapDataFromDB.get_map_size_range()
        context["map_size"] = GetMapDataFromDB.get_map_size()
        context["background"] = GetMapDataFromDB.get_bg_fg_url("background")
        context["foreground"] = GetMapDataFromDB.get_bg_fg_url("foreground")
        context["foreground_type"] = GetMapDataFromDB.get_fg_type()
        context["animations_data"] = GetMapDataFromDB.get_animation_queryset()
        context["resources_data"] = GetMapDataFromDB.get_resource_queryset()
        context["planet_url"] = GetMapDataFromDB.get_fg_element_url("planet")
        context["station_url"] = GetMapDataFromDB.get_fg_element_url("station")
        context["asteroid_url"] = GetMapDataFromDB.get_fg_element_url("asteroid")
        context["security_data"] = GetMapDataFromDB.get_sector_security_choice()
        context["size"] = GetMapDataFromDB.get_size()
        return context

    def post(self, request):
        data_from_post = json.load(request)
        for i in data_from_post:
            print(data_from_post[i])
            table, table_resource = GetMapDataFromDB.get_table(data_from_post[i]['item_type'])
            item_name = data_from_post[i]['item_img_name']
            rsrc_data = data_from_post[i]['resource_data']
            obj_list = []
            for data_i in rsrc_data:
                resource_pk = Resource.objects.filter(name=rsrc_data[data_i]).values('id')
                obj_list.append(
                    table_resource(

                    )
                )
            resr = (table_resource)
            pk = table.objects.filter(name=item_name).values('id')

            print(pk, resource_pk)

        return HttpResponseRedirect(request.path)



admin_site = CustomAdminSite()


@admin.register(User, site=admin_site)
class UserAdmin(admin.ModelAdmin):
    model = User


@admin.register(CashShop, site=admin_site)
class CashShopAdmin(admin.ModelAdmin):
    model = CashShop


@admin.register(UserPurchase, site=admin_site)
class UserPurchaseAdmin(admin.ModelAdmin):
    model = UserPurchase


@admin.register(Resource, site=admin_site)
class ResourceAdmin(admin.ModelAdmin):
    model = Resource


@admin.register(Planet, site=admin_site)
class PlanetAdmin(admin.ModelAdmin):
    model = Planet


@admin.register(Station, site=admin_site)
class StationAdmin(admin.ModelAdmin):
    model = Station


@admin.register(Asteroid, site=admin_site)
class AsteroidAdmin(admin.ModelAdmin):
    model = Asteroid


@admin.register(Player, site=admin_site)
class PlayerAdmin(admin.ModelAdmin):
    model = Player


@admin.register(Faction, site=admin_site)
class FactionAdmin(admin.ModelAdmin):
    model = Faction


@admin.register(Skill, site=admin_site)
class SkillAdmin(admin.ModelAdmin):
    model = Skill


@admin.register(Research, site=admin_site)
class ResearchAdmin(admin.ModelAdmin):
    model = Research


@admin.register(SkillEffect, site=admin_site)
class SkillEffectAdmin(admin.ModelAdmin):
    model = SkillEffect


@admin.register(Recipe, site=admin_site)
class RecipeAdmin(admin.ModelAdmin):
    model = Recipe


@admin.register(Log, site=admin_site)
class LogAdmin(admin.ModelAdmin):
    model = Log


@admin.register(ShipCategory, site=admin_site)
class ShipCategoryAdmin(admin.ModelAdmin):
    model = ShipCategory


@admin.register(Ship, site=admin_site)
class ShipAdmin(admin.ModelAdmin):
    model = Ship


@admin.register(ModuleEffect, site=admin_site)
class ModuleEffectAdmin(admin.ModelAdmin):
    model = ModuleEffect


@admin.register(Module, site=admin_site)
class ModuleAdmin(admin.ModelAdmin):
    model = Module


@admin.register(PlayerLog, site=admin_site)
class PlayerLogAdmin(admin.ModelAdmin):
    model = PlayerLog


@admin.register(PlayerResource, site=admin_site)
class PlayerResourceAdmin(admin.ModelAdmin):
    model = PlayerResource


@admin.register(PlayerRecipe, site=admin_site)
class PlayerRecipeAdmin(admin.ModelAdmin):
    model = PlayerRecipe


@admin.register(PlayerSkillEffect, site=admin_site)
class PlayerSkillEffectAdmin(admin.ModelAdmin):
    model = PlayerSkillEffect


@admin.register(PlayerResearch, site=admin_site)
class PlayerResearchAdmin(admin.ModelAdmin):
    model = PlayerResearch


@admin.register(PlayerPrivateMessage, site=admin_site)
class PlayerPrivateMessageAdmin(admin.ModelAdmin):
    model = PlayerPrivateMessage


@admin.register(PlayerShip, site=admin_site)
class PlayerShipAdmin(admin.ModelAdmin):
    model = PlayerShip


@admin.register(PlayerShipModule, site=admin_site)
class PlayerShipModuleAdmin(admin.ModelAdmin):
    model = PlayerShipModule


@admin.register(PlayerShipResource, site=admin_site)
class PlayerShipResourceAdmin(admin.ModelAdmin):
    model = PlayerShipResource


@admin.register(FactionLeader, site=admin_site)
class FactionLeaderAdmin(admin.ModelAdmin):
    model = FactionLeader


@admin.register(FactionResource, site=admin_site)
class FactionResourceAdmin(admin.ModelAdmin):
    model = FactionResource


@admin.register(FactionRank, site=admin_site)
class FactionRankAdmin(admin.ModelAdmin):
    model = FactionRank


@admin.register(PlanetResource, site=admin_site)
class PlanetResourceAdmin(admin.ModelAdmin):
    model = PlanetResource


@admin.register(AsteroidResource, site=admin_site)
class AsteroidResourceAdmin(admin.ModelAdmin):
    model = AsteroidResource


@admin.register(StationResource, site=admin_site)
class StationResourceAdmin(admin.ModelAdmin):
    model = StationResource


@admin.register(Sector, site=admin_site)
class SectorAdmin(admin.ModelAdmin):
    model = Sector
