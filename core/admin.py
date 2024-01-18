from django.contrib import admin
from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic.edit import FormMixin

from core.backend.tiles import CropThisImage
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
    SectorContent
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
                    }
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
                   re_path(r'^my_view/$', self.admin_view(admin_index)),
                   re_path(r'^crop_image/$', self.admin_view(CropImageView.as_view()), name="crop-image")
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
            category = form.cleaned_data.get('category')
            img = request.FILES["img_input"]
            CropThisImage(img, category).crop_and_save()
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


@admin.register(SectorContent, site=admin_site)
class SectorContentAdmin(admin.ModelAdmin):
    model = SectorContent

