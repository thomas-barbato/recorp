from random import random
import re
import json
import ast
import random
from django.contrib import admin
from django.shortcuts import render, redirect
from django.urls import path
from django.contrib import messages
from core.backend.player_actions import send_admin_announcement
from pprint import pprint
from django.contrib import admin
from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils.translation import gettext as _
from django.contrib.messages import get_messages
from django.db.models import Q
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib import messages
from core.backend.tiles import UploadThisImage
from core.backend.get_data import GetDataFromDB
from django.views.generic import TemplateView, DeleteView, UpdateView, ListView
from core.forms import UploadImageForm, SetXpForm
from core.views import admin_index
from core.backend.generate_missing_frames import generate_missing_frames
from django.contrib.auth.decorators import user_passes_test
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
    Warp,
    WarpZone,
    SectorWarpZone,
    Skill,
    SkillEffect,
    Recipe,
    Research,
    Log,
    ShipCategory,
    Ship,
    Module,
    PlayerLog,
    PlayerResource,
    PlayerRecipe,
    PlayerSkill,
    PlayerResearch,
    PlayerShip,
    PlayerShipResource,
    FactionLeader,
    FactionResource,
    FactionRank,
    PlanetResource,
    AsteroidResource,
    StationResource,
    Sector,
    Npc,
    NpcTemplate,
    NpcTemplateResource,
    NpcTemplateSkill,
    SkillExperience,
    LoggedInUser,
    Security,
    Warp,
    WarpZone,
    SectorWarpZone,
    ShipModuleLimitation,
    Archetype,
    SkillExperience,
    NpcResource,
    ArchetypeModule,
    PlayerShipModule,
    PrivateMessage,
    PrivateMessageRecipients,
    Group,
    PlayerGroup,
    Message,
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
                        "name": "send announcement message",
                        "object_name": "send announcement message",
                        "admin_url": "/admin/send_announcement",
                        "view_only": True,
                    },
                    {
                        "name": "set xp progress",
                        "object_name": "set xp value progression per level",
                        "admin_url": "/admin/set_xp_progression",
                        "view_only": True,
                    },
                    {
                        "name": "upload new image element",
                        "object_name": "upload new image element",
                        "admin_url": "/admin/upload_image_element",
                        "view_only": True,
                    },
                    {
                        "name": "create foreground item",
                        "object_name": "create foreground item",
                        "admin_url": "/admin/create_foreground_item/",
                        "view_only": True,
                    },
                    {
                        "name": "create / update / delete sector",
                        "object_name": "create / update / delete sector",
                        "admin_url": "/admin/sector_gestion",
                        "view_only": True,
                    },
                    {
                        "name": "create / update / delete new npc template",
                        "object_name": "create / update / delete new npc template",
                        "admin_url": "/admin/npc/template/",
                        "view_only": True,
                    },
                    {
                        "name": "Create link bewteen warpzone",
                        "object_name": "Create link bewteen warpzone",
                        "admin_url": "/admin/sector_gestion/warpzone/warpzone_link_add",
                        "view_only": True,
                    },
                    {
                        "name": "Generate missing frames",
                        "object_name": "generate missing frames",
                        "admin_url": "/admin/generate_missing_frames/",
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
            re_path(r"^set_xp_progression/$",
                self.admin_view(SetXpValueView.as_view()),
                name="set-xp-progression",
            ),
            re_path(
                r"^upload_image_element/$",
                self.admin_view(UploadImageView.as_view()),
                name="upload-image-element",
            ),
            re_path(
                r"^create_foreground_item/$",
                self.admin_view(CreateForegroundItemView.as_view()),
                name="create-foreground-item",
            ),
            re_path(
                r"^sector_gestion/$",
                self.admin_view(CreateSectorView.as_view()),
                name="sector_gestion",
            ),
            re_path(
                r"^sector_gestion/get_selected_data$",
                self.admin_view(GetSectorElementTypeDataView.as_view()),
                name="get_selected_data",
            ),
            re_path(
                r"^sector_gestion/get_sector_data$",
                self.admin_view(GetSectorDataView.as_view()),
                name="get_sector_data",
            ),
            re_path(
                r"^sector_gestion/save_sector_data$",
                self.admin_view(SetSectorView.as_view()),
                name="save_sector_data",
            ),
            re_path(
                r"^sector_gestion/update_sector_data$",
                self.admin_view(UpdateSectorView.as_view()),
                name="update_sector_data",
            ),
            re_path(
                r"^sector_gestion/sector_delete$",
                self.admin_view(SectorDeleteView.as_view()),
                name="sector_delete",
            ),
            re_path(
                r"^npc/template/$",
                self.admin_view(NpcTemplateDataView.as_view()),
                name="npc_template",
            ),
            re_path(
                r"^npc/template/npc_template_add$",
                self.admin_view(NpcTemplateDataView.as_view()),
                name="npc_template_add",
            ),
            re_path(
                r"^npc/template/npc_template_delete$",
                self.admin_view(NpcTemplateDeleteDataView.as_view()),
                name="npc_template_delete",
            ),
            re_path(
                r"^npc/template/npc_template_select$",
                self.admin_view(NpcTemplateSelectForUpdateDataView.as_view()),
                name="npc_template_select",
            ),
            re_path(
                r"^npc/template/npc_template_update$",
                self.admin_view(NpcTemplateUpdateDataView.as_view()),
                name="npc_template_update",
            ),
            re_path(
                r"^sector_gestion/warpzone/warpzone_link_add$",
                self.admin_view(WarpzoneLinkDataDisplayView.as_view()),
                name="warpzone_link_add",
            ),
            re_path(
                r"^sector_gestion/warpzone/warpzone_link_delete$",
                self.admin_view(WarpzoneLinkDataDeleteView.as_view()),
                name="warpzone_link_delete",
            ),
            re_path(
                r"^generate_missing_frames/$",
                self.admin_view(self.generate_missing_frames_view),
                name="generate-missing-frames",
            ),
        ] + urls
        return urls
    
    def generate_missing_frames_view(self, request):
        if not request.user.is_superuser:
            messages.error(request, "Permission denied: superuser only.")
            return redirect("/admin/")

        logs, errors = generate_missing_frames()

        for l in logs:
            messages.success(request, l)

        for e in errors:
            messages.error(request, e)

        if not errors:
            messages.success(request, "✔ Toutes les frames manquantes ont été générées.")

        return redirect("/admin/")


class UploadImageView(LoginRequiredMixin, TemplateView):
    template_name = "add_map_element.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context["form"] = UploadImageForm
        return context

    def post(self, request):
        form = UploadImageForm(request.POST, request.FILES)
        if form.is_valid():
            category = form.cleaned_data.get("category")
            type = form.cleaned_data.get("type")
            img = request.FILES["img_input"]
            file_directory_name = form.cleaned_data.get("file_directory_name")
            UploadThisImage(img, category, type, file_directory_name).save()
            messages.success(self.request, "Success")
        return HttpResponseRedirect(request.path)


class CreateForegroundItemView(LoginRequiredMixin, TemplateView):
    template_name = "create_foreground_item.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context["item_choice"] = [
            "planet",
            "asteroid",
            "station",
            "satellite",
            "star",
            "blackhole",
            "warpzone",
        ]
        context["planet_url"] = GetDataFromDB.get_fg_element_url("planet")
        context["station_url"] = GetDataFromDB.get_fg_element_url("station")
        context["asteroid_url"] = GetDataFromDB.get_fg_element_url("asteroid")
        context["satellite_url"] = GetDataFromDB.get_fg_element_url("satellite")
        context["star_url"] = GetDataFromDB.get_fg_element_url("star")
        context["blackhole_url"] = GetDataFromDB.get_fg_element_url("blackhole")
        context["warpzone_url"] = GetDataFromDB.get_fg_element_url("warpzone")
        context["size"] = GetDataFromDB.get_size()
        return context

    def post(self, request):
        select_type = [
            "planet",
            "asteroid",
            "station",
            "satellite",
            "star",
            "blackhole",
            "warpzone",
        ]
        selected = request.POST.get("item-type-choice-section")
        if selected in select_type:
            fg_name = re.sub(r"\W", "", request.POST.get("foreground-item-name"))
            if len(fg_name) == 0:
                fg_name = "Default value name"
            data = {
                "animation": request.POST.get("animation"),
                "type": request.POST.get("item-type-choice-section"),
            }
            match selected:
                case "satellite":
                    size = {"x": 3, "y": 3}
                    Planet.objects.create(name=fg_name, data=data, size=size)
                case "star":
                    size = {"x": 2, "y": 2}
                    Planet.objects.create(name=fg_name, data=data, size=size)
                case "blackhole":
                    size = {"x": 3, "y": 5}
                    Planet.objects.create(name=fg_name, data=data, size=size)
                case "planet":
                    size = {"x": 4, "y": 4}
                    Planet.objects.create(name=fg_name, data=data, size=size)
                case "asteroid":
                    size = {"x": 1, "y": 1}
                    Asteroid.objects.create(name=fg_name, data=data, size=size)
                case "station":
                    size = {"x": 3, "y": 3}
                    Station.objects.create(name=fg_name, data=data, size=size)
                case "warpzone":
                    size = {"x": 2, "y": 3}
                    Warp.objects.create(name=fg_name, data=data, size=size)
                case _:
                    pass
            messages.success(
                self.request, f"{fg_name}({selected}) created with success"
            )
        return HttpResponseRedirect(request.path)


class CreateSectorView(LoginRequiredMixin, TemplateView):
    template_name = "sector_gestion.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context["foreground_element_label"] = [
            "planet",
            "asteroid",
            "station",
            "star",
            "satellite",
            "warpzone",
            "npc"
        ]
        context["map_size_range"] = GetDataFromDB.get_map_size_range()
        context["map_size"] = GetDataFromDB.get_map_size()
        context["background"] = GetDataFromDB.get_bg_fg_url("background")
        context["foreground"] = GetDataFromDB.get_bg_fg_url("foreground")
        context["foreground_type"] = GetDataFromDB.get_fg_type()
        context["animations_data"] = GetDataFromDB.get_animation_queryset()
        context["resources_data"] = GetDataFromDB.get_resource_queryset()
        context["planet_url"] = GetDataFromDB.get_fg_element_url("planet")
        context["star_url"] = GetDataFromDB.get_fg_element_url("star")
        context["blackhole_url"] = GetDataFromDB.get_fg_element_url("blackhole")
        context["satellite_url"] = GetDataFromDB.get_fg_element_url("satellite")
        context["station_url"] = GetDataFromDB.get_fg_element_url("station")
        context["asteroid_url"] = GetDataFromDB.get_fg_element_url("asteroid")
        context["warpzone_url"] = GetDataFromDB.get_fg_element_url("warpzone")
        context["security_data"] = GetDataFromDB.get_table("security").objects.values(
            "id", "name"
        )
        context["sector_data"] = GetDataFromDB.get_table("sector").objects.values(
            "id", "name"
        )
        context["warpzone_data"] = GetDataFromDB.get_table("warpzone_only").objects.values(
            "id", "data__name"
        )
        context["faction_data"] = GetDataFromDB.get_table("faction")[0].objects.all()
        context["size"] = GetDataFromDB.get_size()
        
        return context

    def post(self, request):
        data_from_post = json.load(request)
        response = {"success": False}
        (
            data_is_missing,
            missing_data_response,
        ) = GetDataFromDB.check_if_no_missing_entry(
            data_from_post["map_data"],
            data_item=data_from_post["data"],
        )
        if data_is_missing is False:
            if Sector.objects.filter(
                name=data_from_post["map_data"]["sector_name"]
            ).exists():
                messages.error(
                    self.request,
                    f"Sector with name <b>{data_from_post['map_data']['sector_name']}</b> already exists",
                )
                return HttpResponseRedirect(request.path)

            faction_id = data_from_post["map_data"]["faction_id"]
            if data_from_post["map_data"]["faction_id"] == "none":
                faction_id = 1

            sector = Sector(
                name=data_from_post["map_data"]["sector_name"],
                description=data_from_post["map_data"]["sector_description"],
                image=data_from_post["map_data"]["sector_background"],
                security_id=data_from_post["map_data"]["security"],
                faction_id=faction_id,
                is_faction_level_starter=data_from_post["map_data"][
                    "is_faction_starter"
                ],
            )
            sector.save()

            for item, _ in data_from_post["data"].items():
                item_type = data_from_post["data"][item]["item_type"]
                item_img_name = data_from_post["data"][item]["item_img_name"]
                item_name = data_from_post["data"][item]["item_name"]
                table_item_name = data_from_post["data"][item]["item_id"]
                coordinates = data_from_post["data"][item]["coordinates"]
                
                
                if item_type == "warpzone":
                    
                    table, table_resource, table_zone = GetDataFromDB.get_table(item_type)
                    source_id = table.objects.filter(name=table_item_name).values('id')[0]['id']
                    
                    if table_resource.objects.filter(name=item_name).exists():
                        item_name = f'{item_name}-{random.randint(1,999999)}'
                    
                    table_resource.objects.create(
                        name=item_name,
                        sector_id = sector.pk,
                        source_id = source_id,
                        data={
                            "name": item_name,
                            "description": "A portal that lets you travel to",
                        },
                        coordinates=coordinates
                    )
                    
                    warpzone_id = table_resource.objects.filter(name=item_name).values('id')[0]['id']
                    
                    if data_from_post["data"][item]["item_warpzone_destination"] != "none-selected":
                        table_zone.objects.create(
                            warp_home_id = warpzone_id,
                            warp_destination_id = data_from_post["data"][item]["item_warpzone_destination"]
                        )
                        if table_zone.objects.filter(warp_home_id=data_from_post["data"][item]["item_warpzone_destination"],warp_destination_id = warpzone_id).exists() is False:
                            table_zone.objects.create(warp_home_id=data_from_post["data"][item]["item_warpzone_destination"],warp_destination_id = warpzone_id)
                            
                else:
                    rsrc_data_list = data_from_post["data"][item]["resource_data"]
                    table, table_resource = GetDataFromDB.get_table(item_type)
                    for rsrc in rsrc_data_list:
                        item_type_id = table.objects.filter(name=item_img_name).values_list(
                            "id", flat=True
                        )[0]
                        resource_id = 1 if rsrc == "none" else rsrc
                        table_resource.objects.create(
                            sector_id=sector.pk,
                            resource_id=resource_id,
                            source_id=item_type_id,
                            data={
                                "name": data_from_post["data"][item]["item_name"],
                                "description": data_from_post["data"][item][
                                    "item_description"
                                ],
                            },
                            coordinates=coordinates
                        )
            messages.success(
                self.request,
                f'Sector with name {data_from_post["map_data"]["sector_name"]} created with success',
            )
            response = {"success": True}
        else:
            response = {
                "success": False,
                "errors": f'Error, missing : {", ".join(missing_data_response)}'
            }
        return JsonResponse(json.dumps(response), safe=False)


class SectorDeleteView(LoginRequiredMixin, DeleteView):
    template_name = "sector_gestion.html"
    model = Sector

    def post(self, request, *args, **kwargs):
        response = {"success": False}
        pk = json.load(request)["pk"]
        if GetDataFromDB.check_if_table_pk_exists("sector", pk):
            GetDataFromDB.delete_items_from_sector(pk)
            sector_name = Sector.objects.filter(id=pk).values_list("name", flat=True)[0]
            Sector.objects.filter(id=pk).delete()
            response = {"success": True}
            messages.success(
                self.request,
                f"Sector with name {sector_name} deleted with success",
            )
        return JsonResponse(json.dumps(response), safe=False)
    
    
class GetSectorDataView(LoginRequiredMixin, TemplateView):
    template_name = "sector_gestion.html"
    
    def post(self, request):
        
        response = {}
        
        try:
            sector_id = json.load(request)["sector_id"]
            sector = Sector.objects.get(id=sector_id)
            response = {
                "sector" : {
                    "name": sector.name,
                    "description": sector.description,
                    "id" : sector_id,
                    "image": sector.image,
                    "is_faction_level_starter" : sector.is_faction_level_starter,
                    "security_id" : sector.security_id,
                    "faction_id" : sector.faction_id
                },
                "star" : [e for e in sector.planet_sector.filter(source_id__data__type="star").values(
                    "source_id__size", "data", "coordinates", "id", "data__description",
                    "source_id", "source_id__data__type", "source_id__data__animation"
                )],
                "planet" : [e for e in sector.planet_sector.filter(source_id__data__type="planet").values(
                    "source_id__size", "data", "coordinates", "id", "data__description",
                    "source_id", "source_id__data__type", "source_id__data__animation"
                )],
                "satellite" : [e for e in sector.planet_sector.filter(source_id__data__type="satellite").values(
                    "source_id__size", "data", "coordinates", "id", "data__description",
                    "source_id", "source_id__data__type", "source_id__data__animation" 
                )],
                "asteroid" : [e for e in sector.asteroid_sector.values(
                    "source_id__size", "data", "coordinates", "id", "data__description",
                    "source_id", "source_id__data__type", "source_id__data__animation"
                )],
                "warpzone" : [e for e in sector.warp_sector.values(
                    "source_id__size", "data", "coordinates", "data__description",
                    "source_id", "id", "sector_id", "source_id__data__animation" 
                )],
                "station" : [e for e in sector.station_sector.values(
                    "source_id__size", "data", "coordinates", "id", "data__description", 
                    "source_id", "source_id__data__type" 
                )],
                "npc": [e for e in sector.npc_sector.values(
                    "id", "npc_template_id__ship_id__ship_category_id__size",
                    "npc_template_id__ship_id__image", "npc_template_id__ship_id__name",
                    "npc_template_id", "coordinates", "npc_template_id__name", "npc_template_id__displayed_name"
                )]
            }
        except Sector.DoesNotExist:
            return tuple()
        
        return JsonResponse(json.dumps(response), safe=False)
    

class GetSectorElementTypeDataView(LoginRequiredMixin, TemplateView):
    template_name = "sector_gestion.html"
    
    def post(self, request):
        
        foreground_element_type = json.load(request)["element_type"]
        response = {}
        available_type = {
            "star" : [e for e in Planet.objects.filter(data__type="star").values('id', 'name', 'data__animation', 'size')],
            "planet": [e for e in Planet.objects.filter(data__type="planet").values('id', 'name', 'data__animation', 'size')],
            "satellite": [e for e in Planet.objects.filter(data__type="satellite").values('id', 'name', 'data__animation', 'size')],
            "asteroid": [e for e in Asteroid.objects.values('id', 'name', 'data__animation', 'size')],
            "warpzone": [e for e in Warp.objects.values('id', 'data__animation', 'size')],
            "station": [e for e in Station.objects.values('id', 'name', 'data__animation', 'size')],
            "npc" : [e for e in NpcTemplate.objects.values(
                "id", "ship_id", "ship_id__name", "ship_id__image",
                "ship_id__ship_category_id__size", "displayed_name"
            )]
            
        }
        
        if available_type.get(foreground_element_type) is not None:
            response = available_type[foreground_element_type]
            
        return JsonResponse(json.dumps(response), safe=False)
    
    
class SetSectorView(LoginRequiredMixin, TemplateView):
    template_name = "sector_gestion.html"
    
    def post(self, request):
        sector_elements = json.load(request)
        map_elements = sector_elements["map"]
        sector_data = sector_elements["sector"]
        response = {"success": False}
        
        sector = Sector(
            name=sector_data["name"],
            image=sector_data["image"],
            description=sector_data["description"],
            is_faction_level_starter=sector_data["is_faction_starter"],
            faction_id=sector_data["faction"],
            security_id=sector_data["security_level"]
        )
        
        sector.save()

        for index in map_elements:
            for element in map_elements[index]:
                
                if index in ["planet", "star", "satellite"]:
                    source_id = map_elements[index][element]['data__animation'].split('_')[1]
                    PlanetResource.objects.create(
                        quantity=0,
                        data={
                            "name": map_elements[index][element]["displayed_name"],
                            "description": map_elements[index][element]["description"]
                        },
                        coordinates=map_elements[index][element]["coordinates"],
                        resource_id=1,
                        sector_id=sector.id,
                        source_id=source_id
                    )
                elif index == "asteroid":
                    
                    source_id = map_elements[index][element]['data__animation'].split('_')[1]
                    AsteroidResource.objects.create(
                        quantity=0,
                        data={
                            "name": map_elements[index][element]["displayed_name"],
                            "description": map_elements[index][element]["description"]
                        },
                        coordinates=map_elements[index][element]["coordinates"],
                        resource_id=1,
                        sector_id=sector.id,
                        source_id=source_id
                    )
                elif index == "station":
                    
                    source_id = map_elements[index][element]['data__animation'].split('_')[1]
                    StationResource.objects.create(
                        quantity=0,
                        data={
                            "name": map_elements[index][element]["displayed_name"],
                            "description": map_elements[index][element]["description"]
                        },
                        coordinates=map_elements[index][element]["coordinates"],
                        resource_id=1,
                        sector_id=sector.id,
                        source_id=source_id
                    )
                    
                elif index == "warpzone":
                    
                    source_id = map_elements[index][element]['data__animation'].split('_')[1]
                    WarpZone.objects.create(
                        data={
                            "name": map_elements[index][element]["displayed_name"],
                            "description": map_elements[index][element]["description"]
                        },
                        coordinates=map_elements[index][element]["coordinates"],
                        sector_id=sector.id,
                        source_id=source_id
                    )   
                elif index == "npc":
                    id = map_elements[index][element]["data__animation"].split('_')[1]
                    ThisNpcTemplate = NpcTemplate.objects.filter(id=id)
                    Npc.objects.create(
                        coordinates=map_elements[index][element]['coordinates'],
                        current_ap=10,
                        max_ap=10,
                        hp=ThisNpcTemplate.values_list('max_hp', flat=True)[0],
                        movement=ThisNpcTemplate.values_list('max_movement', flat=True)[0],
                        missile_defense=ThisNpcTemplate.values_list('max_missile_defense', flat=True)[0],
                        thermal_defense=ThisNpcTemplate.values_list('max_thermal_defense', flat=True)[0],
                        ballistic_defense=ThisNpcTemplate.values_list('max_ballistic_defense', flat=True)[0],
                        status="FULL",
                        faction_id=1,
                        npc_template_id=ThisNpcTemplate.values_list('id', flat=True)[0],
                        sector_id=sector.id
                    )
            
        return JsonResponse(json.dumps({}), safe=False)
    
    
class UpdateSectorView(LoginRequiredMixin, TemplateView):
    template_name = "sector_gestion.html"
    
    def post(self, request):
        
        sector_elements = json.load(request)
        map_elements = sector_elements["map"]
        sector_data = sector_elements["sector"]
        sector_pk = sector_data["sector_id"]
        response = {"success": False}
        
        if GetDataFromDB.check_if_table_pk_exists("sector", sector_pk):
            Sector.objects.filter(id=sector_pk).update(
                name=sector_data["name"],
                faction_id=sector_data["faction"],
                is_faction_level_starter=sector_data["is_faction_starter"],
                image=sector_data["image"],
                security_id=sector_data["security_level"],
                description=sector_data["description"]
            )
            
            GetDataFromDB.delete_items_from_sector(sector_pk)
            
            for index in map_elements:
                for element in map_elements[index]:
                
                    if index in ["planet", "star", "satellite"]:
                        source_id = map_elements[index][element]['data__animation'].split('_')[1]
                        PlanetResource.objects.create(
                            quantity=0,
                            data={
                                "name": map_elements[index][element]["displayed_name"],
                                "description": map_elements[index][element]["description"]
                            },
                            coordinates=map_elements[index][element]["coordinates"],
                            resource_id=1,
                            sector_id=sector_pk,
                            source_id=source_id
                        )
                    elif index == "asteroid":
                        
                        source_id = map_elements[index][element]['data__animation'].split('_')[1]
                        AsteroidResource.objects.create(
                            quantity=0,
                            data={
                                "name": map_elements[index][element]["displayed_name"],
                                "description": map_elements[index][element]["description"]
                            },
                            coordinates=map_elements[index][element]["coordinates"],
                            resource_id=1,
                            sector_id=sector_pk,
                            source_id=source_id
                        )
                    elif index == "station":
                        
                        source_id = map_elements[index][element]['data__animation'].split('_')[1]
                        StationResource.objects.create(
                            quantity=0,
                            data={
                                "name": map_elements[index][element]["displayed_name"],
                                "description": map_elements[index][element]["description"]
                            },
                            coordinates=map_elements[index][element]["coordinates"],
                            resource_id=1,
                            sector_id=sector_pk,
                            source_id=source_id
                        )
                        
                    elif index == "warpzone":
                        
                        source_id = map_elements[index][element]['data__animation'].split('_')[1]
                        WarpZone.objects.create(
                            data={
                                "name": map_elements[index][element]["displayed_name"],
                                "description": map_elements[index][element]["description"]
                            },
                            coordinates=map_elements[index][element]["coordinates"],
                            sector_id=sector_pk,
                            source_id=source_id
                        )   
                    elif index == "npc":
                        source_id = map_elements[index][element]["data__animation"].split('_')[1]
                        ThisNpcTemplate = NpcTemplate.objects.filter(id=source_id)
                        Npc.objects.create(
                            coordinates=map_elements[index][element]['coordinates'],
                            current_ap=10,
                            max_ap=10,
                            hp=ThisNpcTemplate.values_list('max_hp', flat=True)[0],
                            movement=ThisNpcTemplate.values_list('max_movement', flat=True)[0],
                            missile_defense=ThisNpcTemplate.values_list('max_missile_defense', flat=True)[0],
                            thermal_defense=ThisNpcTemplate.values_list('max_thermal_defense', flat=True)[0],
                            ballistic_defense=ThisNpcTemplate.values_list('max_ballistic_defense', flat=True)[0],
                            status="FULL",
                            faction_id=1,
                            npc_template_id=ThisNpcTemplate.values_list('id', flat=True)[0],
                            sector_id=sector_pk
                        )
        return JsonResponse(json.dumps({}), safe=False)

class NpcTemplateDataView(LoginRequiredMixin, TemplateView):
    template_name = "create_npc_template.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        _, npc_template, npc_resources, _ = GetDataFromDB.get_table("npc")
        ship_list = GetDataFromDB.get_table("ship").objects.values(
            "name",
            "id",
            "image",
            "module_slot_available",
            "default_hp",
            "default_movement",
            "ship_category_id__name",
        )
        skill_list = GetDataFromDB.get_table("skill").objects.values(
            "name", "id", "category"
        )
        resources = GetDataFromDB.get_table("resource").objects.all()
        modules = GetDataFromDB.get_table("module").objects.all()

        context["npc_template"] = npc_template.objects.all()
        context["npc_resources"] = npc_resources.objects.values("id", "quantity")
        context["npc_behavior"] = ["passive", "close_range", "middle_range", "long_range", "support", "defensive"]
        context["ship_list"] = ship_list
        context["skill_list"] = skill_list
        context["skill_categories"] = [
            "Steering",
            "Offensive",
            "Defensive",
            "Utility",
            "Industry",
        ]
        context["resource_list"] = resources
        context["module_list"] = modules
        context["module_types"] = [
            "DEFENSE_BALLISTIC",
            "DEFENSE_MISSILE",
            "DEFENSE_THERMAL",
            "HOLD",
            "HULL",
            "MOVEMENT",
            "REPAIRE",
            "GATHERING",
            "RESEARCH",
            "CRAFT",
            "ELECTRONIC_WARFARE",
            "WEAPONRY",
        ]
        return context

    def post(self, request, *args, **kwargs):
        data_from_post = json.load(request)
        module_dict = {}
        skill_dict = {}
        module_id_list = []

        for module in data_from_post["data"]["modules"]:
            module_id_list.append(int(module["id"]))
            if isinstance(module["effects"], str):
                module_dict[module["type"]] = ast.literal_eval(module["effects"])
            else:
                module_dict[module["type"]] = module["effects"]

        for skill in data_from_post["data"]["skills"]:
            level = (
                data_from_post["data"]["difficulty"] if skill["checked"] is True else 0
            )
            skill_dict[skill["name"]] = {"id": int(skill["id"]), "level": level}

        spaceship = Ship.objects.filter(id=data_from_post["data"]["ship"]).values(
            "id", "default_hp", "default_movement", "ship_category_id__name"
        )[0]
        module_bonus_hp = module_dict["HULL"]["hp"] if "HULL" in module_dict else 0
        module_bonus_move = (
            module_dict["MOVEMENT"]["movement"] if "MOVEMENT" in module_dict else 0
        )
        module_ballistic_defense = (
            module_dict["DEFENSE_BALLISTIC"]["defense"]
            if "DEFENSE_BALLISTIC" in module_dict
            else 0
        )
        module_missile_defense = (
            module_dict["DEFENSE_MISSILE"]["defense"]
            if "DEFENSE_MISSILE" in module_dict
            else 0
        )
        module_thermal_defense = (
            module_dict["DEFENSE_THERMAL"]["defense"]
            if "DEFENSE_THERMAL" in module_dict
            else 0
        )
        module_hold_capacity = (
            module_dict["HOLD"]["capacity"] if "HOLD" in module_dict else 0
        )
        hp_total = int(
            (spaceship["default_hp"] + int(module_bonus_hp))
            + (50 * (int(skill_dict["repaire"]["level"]) / 100))
        )
        move_total = int(
            (spaceship["default_movement"] + int(module_bonus_move))
            + (
                25
                * (int(skill_dict[spaceship["ship_category_id__name"]]["level"]) / 100)
            )
        )

        new_template = NpcTemplate.objects.create(
            name=data_from_post["data"]["name"],
            displayed_name=data_from_post["data"]["displayed_name"],
            difficulty=data_from_post["data"]["difficulty"],
            ship_id=spaceship["id"],
            description="",
            module_id_list=module_id_list,
            max_hp=hp_total,
            max_movement=move_total,
            max_missile_defense=module_missile_defense,
            max_thermal_defense=module_thermal_defense,
            max_ballistic_defense=module_ballistic_defense,
            hold_capacity=module_hold_capacity,
            behavior=data_from_post["data"]["behavior"]
        )
        

        for skill in skill_dict:
            NpcTemplateSkill.objects.create(
                npc_template_id=new_template.pk,
                skill_id=int(skill_dict[skill]["id"]),
                level=int(skill_dict[skill]["level"]),
            )

        for resource in data_from_post["data"]["resource"]:
            NpcTemplateResource.objects.create(
                resource_id=int(resource["id"]),
                npc_template_id=new_template.pk,
                quantity=int(resource["quantity"]),
                can_be_randomized=resource["can_be_randomized"],
            )


class NpcTemplateSelectForUpdateDataView(LoginRequiredMixin, TemplateView):
    template_name = "create_npc_template.html"

    def post(self, request, **kwargs):
        data_from_post = json.load(request)
        id = int(data_from_post["data"])
        selected_template = NpcTemplate.objects.filter(id=id)
        result_dict = dict()
        if selected_template.exists():
            template, skills, resources = GetDataFromDB.get_npc_template_data(id)
            result_dict["template"] = template
            result_dict["skills"] = skills
            result_dict["resources"] = resources
        else:
            messages.error(
                self.request,
                f"This template is unknown...",
            )

        return JsonResponse(json.dumps(result_dict), safe=False)


class NpcTemplateUpdateDataView(LoginRequiredMixin, UpdateView):
    model = NpcTemplate

    def post(self, request, *args, **kwargs):
        data_from_post = json.load(request)
        template_id = data_from_post["data"]["template_id"]
        template = NpcTemplate.objects.filter(id=template_id)
        if template.exists():

            module_dict = {}
            skill_dict = {}
            module_id_list = []

            for module in data_from_post["data"]["modules"]:
                module_id_list.append(int(module["id"]))
                if isinstance(module["effects"], str):
                    module_dict[module["type"]] = ast.literal_eval(module["effects"])
                else:
                    module_dict[module["type"]] = module["effects"]

            for skill in data_from_post["data"]["skills"]:
                level = (
                    data_from_post["data"]["difficulty"]
                    if skill["checked"] is True
                    else 0
                )
                skill_dict[skill["name"]] = {"id": int(skill["id"]), "level": level}

            spaceship = Ship.objects.filter(id=data_from_post["data"]["ship"]).values(
                "id", "default_hp", "default_movement", "ship_category_id__name"
            )[0]
            module_bonus_hp = (
                module_dict["HULL"]["hp"] if "HULL" in module_dict else 0
            )
            module_bonus_move = (
                module_dict["MOVEMENT"]["movement"] if "MOVEMENT" in module_dict else 0
            )
            module_ballistic_defense = (
                module_dict["DEFENSE_BALLISTIC"]["defense"]
                if "DEFENSE_BALLISTIC" in module_dict
                else 0
            )
            module_missile_defense = (
                module_dict["DEFENSE_MISSILE"]["defense"]
                if "DEFENSE_MISSILE" in module_dict
                else 0
            )
            module_thermal_defense = (
                module_dict["DEFENSE_THERMAL"]["defense"]
                if "DEFENSE_THERMAL" in module_dict
                else 0
            )
            module_hold_capacity = (
                module_dict["HOLD"]["capacity"] if "HOLD" in module_dict else 0
            )
            hp_total = int(
                (spaceship["default_hp"] + int(module_bonus_hp))
                + (50 * (int(skill_dict["REPAIRE"]["level"]) / 100))
            )
            move_total = int(
                (spaceship["default_movement"] + int(module_bonus_move))
                + (
                    25
                    * (
                        int(skill_dict[spaceship["ship_category_id__name"]]["level"])
                        / 100
                    )
                )
            )

            NpcTemplate.objects.filter(id=template_id).update(
                name=data_from_post["data"]["name"],
                displayed_name=data_from_post["data"]["displayed_name"],
                difficulty=data_from_post["data"]["difficulty"],
                ship_id=spaceship["id"],
                description="",
                module_id_list=module_id_list,
                max_hp=hp_total,
                max_movement=move_total,
                max_missile_defense=module_missile_defense,
                max_thermal_defense=module_thermal_defense,
                max_ballistic_defense=module_ballistic_defense,
                hold_capacity=module_hold_capacity,
                behavior=data_from_post["data"]["behavior"]
            )

            NpcTemplateSkill.objects.filter(npc_template_id=template_id).delete()
            NpcTemplateResource.objects.filter(npc_template_id=template_id).delete()

            for skill in skill_dict:
                NpcTemplateSkill.objects.create(
                    npc_template_id=template_id,
                    skill_id=int(skill_dict[skill]["id"]),
                    level=int(skill_dict[skill]["level"]),
                )

            for resource in data_from_post["data"]["resource"]:
                NpcTemplateResource.objects.create(
                    resource_id=int(resource["id"]),
                    npc_template_id=template_id,
                    quantity=int(resource["quantity"]),
                    can_be_randomized=resource["can_be_randomized"],
                )


class NpcTemplateDeleteDataView(LoginRequiredMixin, DeleteView):
    template_name = "create_npc_template.html"
    model = NpcTemplate

    def post(self, request, *args, **kwargs):
        data_from_post = json.load(request)
        template_id = data_from_post["data"]
        NpcTemplateSkill.objects.filter(npc_template_id=template_id).delete()
        NpcTemplateResource.objects.filter(npc_template_id=template_id).delete()
        NpcTemplate.objects.filter(id=template_id).delete()
    
    
class SetXpValueView(LoginRequiredMixin, TemplateView):
    template_name = "set_xp_value.html"
    model = SkillExperience
    form_class = SetXpForm
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["form"] = self.form_class
        return context

    def post(self, request, **kwargs):
        required_xp_value = int(self.request.POST['required_experience'])
        if required_xp_value >= 0:
            SkillExperience.objects.all().delete()
            for i in range(0,100):
                experience = SkillExperience(
                    level=i,
                    required_experience=(required_xp_value * i) * 0.5
                )
                experience.save()
            messages.success(
                self.request, f"xp required set with success, with value : {self.request.POST['required_experience']}"
            )
        else:
            messages.error(
                self.request, f"your value can't be saved, please retry with correct value (int value)"
            )
        return HttpResponseRedirect(request.path)
    
    
class WarpzoneLinkDataDisplayView(LoginRequiredMixin, TemplateView):
    template_name = "create_link_between_warpzone.html"
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["warpzone"] = [e for e in WarpZone.objects.values(
            'sector_id__name', 
            'sector_id', 
            'data__name', 
            'coordinates', 
            'id'
            )]
        context["already_existing_warpzone"] = [e for e in SectorWarpZone.objects.values(
            'id',
            'warp_home_id__data__name',
            'warp_destination_id__data__name',
            'warp_home_id__coordinates',
            'warp_destination_id__coordinates',
            'warp_home_id__sector_id__name',
            'warp_destination_id__sector_id__name'
        )]
        return context
    
    def post(self, request, **kwargs):
        recieved_data = json.load(request)
        
        source = recieved_data['source']
        destination = recieved_data['destination']
        wayback = recieved_data['wayback']
        
        response = {}
        
        if source and destination:
            
            source_to_dest = []
            dest_to_source = []
            
            if SectorWarpZone.objects.filter(warp_destination_id = destination, warp_home_id = source).exists() is False:
            
                source_to_dest = SectorWarpZone(
                    warp_destination_id = destination,
                    warp_home_id = source
                )
                source_to_dest.save()
            
            if wayback:
            
                if SectorWarpZone.objects.filter(warp_destination_id = source, warp_home_id = destination).exists() is False:
                
                    dest_to_source = SectorWarpZone(
                        warp_destination_id = source,
                        warp_home_id = destination
                    )
                    dest_to_source.save()
                    
        return JsonResponse(json.dumps(response), safe=False)
    
    
class WarpzoneLinkDataDeleteView(LoginRequiredMixin, TemplateView):
    template_name = "create_link_between_warpzone.html"
    
    def post(self, request, **kwargs):
        recieved_data = json.load(request)
        
        source = recieved_data['id']
        data = SectorWarpZone.objects.filter(id=source).values('warp_home_id', 'warp_destination_id')[0]
        response = {}
        
        SectorWarpZone.objects.filter(warp_home_id=data['warp_home_id'], warp_destination_id=data['warp_destination_id']).delete()
        SectorWarpZone.objects.filter(warp_home_id=data['warp_destination_id'], warp_destination_id=data['warp_home_id']).delete()
        
        return JsonResponse(json.dumps(response), safe=False)

class NpcToSectorDeleteDataView(LoginRequiredMixin, DeleteView):
    template_name = "create_npc_template.html"
    model = Npc


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


@admin.register(PlayerSkill, site=admin_site)
class PlayerSkillAdmin(admin.ModelAdmin):
    model = PlayerSkill


@admin.register(PlayerResearch, site=admin_site)
class PlayerResearchAdmin(admin.ModelAdmin):
    model = PlayerResearch


@admin.register(PlayerShip, site=admin_site)
class PlayerShipAdmin(admin.ModelAdmin):
    model = PlayerShip


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


@admin.register(Npc, site=admin_site)
class NpcrAdmin(admin.ModelAdmin):
    model = Npc


@admin.register(NpcTemplateResource, site=admin_site)
class NpcTemplateResourceAdmin(admin.ModelAdmin):
    model = NpcTemplateResource


@admin.register(NpcTemplate, site=admin_site)
class NpcTemplateAdmin(admin.ModelAdmin):
    model = NpcTemplate


@admin.register(NpcTemplateSkill, site=admin_site)
class NpcTemplateSkillAdmin(admin.ModelAdmin):
    model = NpcTemplateSkill

@admin.register(LoggedInUser, site=admin_site)
class LoggedInUserAdmin(admin.ModelAdmin):
    model = LoggedInUser


@admin.register(Security, site=admin_site)
class SecurityAdmin(admin.ModelAdmin):
    model = Security


@admin.register(Warp, site=admin_site)
class WarpAdmin(admin.ModelAdmin):
    model = Warp


@admin.register(WarpZone, site=admin_site)
class WarpZoneAdmin(admin.ModelAdmin):
    model = WarpZone


@admin.register(SectorWarpZone, site=admin_site)
class SectorWarpZoneAdmin(admin.ModelAdmin):
    model = SectorWarpZone


@admin.register(ShipModuleLimitation, site=admin_site)
class ShipModuleLimitationAdmin(admin.ModelAdmin):
    model = ShipModuleLimitation


@admin.register(Archetype, site=admin_site)
class ArchetypeAdmin(admin.ModelAdmin):
    model = Archetype


@admin.register(SkillExperience, site=admin_site)
class SkillExperienceAdmin(admin.ModelAdmin):
    model = SkillExperience


@admin.register(NpcResource, site=admin_site)
class NpcResourceAdmin(admin.ModelAdmin):
    model = NpcResource


@admin.register(ArchetypeModule, site=admin_site)
class ArchetypeModuleAdmin(admin.ModelAdmin):
    model = ArchetypeModule


@admin.register(PlayerShipModule, site=admin_site)
class PlayerShipModuleAdmin(admin.ModelAdmin):
    model = PlayerShipModule


@admin.register(Group, site=admin_site)
class GroupAdmin(admin.ModelAdmin):
    model = Group


@admin.register(PlayerGroup, site=admin_site)
class PlayerGroupAdmin(admin.ModelAdmin):
    model = PlayerGroup


@admin.register(Message, site=admin_site)
class MessageAdmin(admin.ModelAdmin):
    model = Message
    
@admin.register(PrivateMessage, site=admin_site)
class PrivateMessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'sender', 'priority', 'timestamp', 'recipient_count')
    list_filter = ('priority', 'timestamp')
    search_fields = ('subject', 'body', 'sender__name')
    readonly_fields = ('timestamp', 'created_at', 'updated_at')
    
    def recipient_count(self, obj):
        """Affiche le nombre de destinataires"""
        return obj.received_messages.count()
    recipient_count.short_description = 'Destinataires'
    
    def get_urls(self):
        """Ajoute une URL custom pour envoyer des annonces"""
        urls = super().get_urls()
        custom_urls = [
            path('send-announcement/', 
                self.admin_site.admin_view(self.send_announcement_view),
                name='send-announcement'),
        ]
        return custom_urls + urls
    
    def send_announcement_view(self, request):
        """Vue pour envoyer une annonce à tous les joueurs"""
        if request.method == 'POST':
            subject = request.POST.get('subject')
            body = request.POST.get('body')
            priority = request.POST.get('priority', 'HIGH')
            recipient_type = request.POST.get('recipient_type', 'all')
            
            if not subject or not body:
                messages.error(request, 'Sujet et corps sont obligatoires')
                return render(request, 'admin/send_announcement.html', {
                    'title': 'Envoyer une annonce',
                    'priorities': PrivateMessage.PRIORITY_CHOICES,
                })
            
            try:
                # Déterminer les destinataires
                recipient_ids = None
                if recipient_type == 'all':
                    recipient_ids = None  # Tous les joueurs
                elif recipient_type == 'faction':
                    faction_id = request.POST.get('faction_id')
                    if faction_id:
                        recipient_ids = list(
                            Player.objects.filter(faction_id=faction_id)
                            .values_list('id', flat=True)
                        )
                
                # Envoyer l'annonce
                message = send_admin_announcement(
                    admin_user_id=request.user.id,
                    subject=subject,
                    body=body,
                    recipient_ids=recipient_ids,
                    priority=priority
                )
                
                recipient_count = message.received_messages.count()
                messages.success(
                    request, 
                    f'Annonce "{subject}" envoyée à {recipient_count} joueurs'
                )
                return redirect('admin:core_privatemessage_changelist')
                
            except Exception as e:
                messages.error(request, f'Erreur: {str(e)}')
        
        # GET request - afficher le formulaire
        from core.models import Faction
        return render(request, 'admin/send_announcement.html', {
            'title': 'Envoyer une annonce',
            'priorities': PrivateMessage.PRIORITY_CHOICES,
            'factions': Faction.objects.all(),
        })
    
    # Ajouter un bouton dans la liste des messages
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_announcement_button'] = True
        return super().changelist_view(request, extra_context)
    

@admin.register(PrivateMessageRecipients, site=admin_site)
class PrivateMessageRecipientsAdmin(admin.ModelAdmin):
    model = PrivateMessageRecipients