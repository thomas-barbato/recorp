from random import random
import re
import json
import ast
from django.contrib import admin
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages import get_messages
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib import messages
from core.backend.tiles import UploadThisImage
from core.backend.get_data import GetDataFromDB
from django.views.generic import TemplateView, DeleteView, UpdateView, ListView
from core.forms import UploadImageForm
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
    Warp,
    SectorWarp,
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
    PlayerPrivateMessage,
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
                        "name": "create / update / delete new npc and assign it on sector",
                        "object_name": "create / update / delete new npc and assign it on sector",
                        "admin_url": "/admin/sector_gestion/npc",
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
                r"^sector_gestion/sector_data$",
                self.admin_view(SectorDataView.as_view()),
                name="sector_data",
            ),
            re_path(
                r"^sector_gestion/sector_update_data$",
                self.admin_view(SectorUpdateDataView.as_view()),
                name="sector_update_data",
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
                r"^sector_gestion/npc$",
                self.admin_view(NpcToSectorView.as_view()),
                name="npc",
            ),
            re_path(
                r"^sector_gestion/get_ship_data$",
                self.admin_view(NpcToSectorShipDataView.as_view()),
                name="get_ship_data",
            ),
            re_path(
                r"^sector_gestion/npc_assign_update$",
                self.admin_view(NpcToSectorUpdateDataView.as_view()),
                name="npc_assign_update",
            ),
            re_path(
                r"^sector_gestion/npc/delete$",
                self.admin_view(NpcToSectorDeleteDataView.as_view()),
                name="npc_assign_delete",
            ),
        ] + urls
        return urls


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
                    size = {"size_x": 3, "size_y": 3}
                    Planet.objects.create(name=fg_name, data=data, size=size)
                case "star":
                    size = {"size_x": 2, "size_y": 2}
                    Planet.objects.create(name=fg_name, data=data, size=size)
                case "blackhole":
                    size = {"size_x": 3, "size_y": 5}
                    Planet.objects.create(name=fg_name, data=data, size=size)
                case "planet":
                    size = {"size_x": 4, "size_y": 4}
                    Planet.objects.create(name=fg_name, data=data, size=size)
                case "asteroid":
                    size = {"size_x": 1, "size_y": 1}
                    Asteroid.objects.create(name=fg_name, data=data, size=size)
                case "station":
                    size = {"size_x": 3, "size_y": 3}
                    Station.objects.create(name=fg_name, data=data, size=size)
                case "warpzone":
                    size = {"size_x": 2, "size_y": 3}
                    Station.objects.create(name=fg_name, data=data, size=size)
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
                table, table_resource = GetDataFromDB.get_table(item_type)
                rsrc_data_list = data_from_post["data"][item]["resource_data"]
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
                            "coord_x": data_from_post["data"][item]["coord_x"],
                            "coord_y": data_from_post["data"][item]["coord_y"],
                            "name": data_from_post["data"][item]["item_name"],
                            "description": data_from_post["data"][item][
                                "item_description"
                            ],
                        },
                    )
            messages.success(
                self.request,
                f'Sector with name {data_from_post["map_data"]["sector_name"]} created with success',
            )
            response = {"success": True}
        else:
            messages.error(
                self.request,
                f'Error, missing : {", ".join(missing_data_response)}',
            )
        return JsonResponse(json.dumps(response), safe=False)


class SectorDeleteView(LoginRequiredMixin, DeleteView):
    template_name = "sector_gestion.html"
    model = Sector

    def post(self, request, *args, **kwargs):
        response = {"success": False}
        pk = json.load(request)["pk"]
        if GetDataFromDB.check_if_table_pk_exists("sector", pk):
            sector_name = Sector.objects.filter(id=pk).values_list("name", flat=True)[0]
            Sector.objects.filter(id=pk).delete()
            response = {"success": True}
            messages.success(
                self.request,
                f"Sector with name {sector_name} deleted with success",
            )
        return JsonResponse(json.dumps(response), safe=False)


class SectorDataView(LoginRequiredMixin, TemplateView):
    template_name = "sector_gestion.html"

    def post(self, request):
        pk = json.load(request)["map_id"]
        if Sector.objects.filter(id=pk).exists():
            sector = Sector.objects.get(id=pk)
            planets, asteroids, stations, warpzones = GetDataFromDB.get_items_from_sector(pk)
            table_set = {
                "planet": planets,
                "asteroid": asteroids,
                "station": stations,
                "warpzone": warpzones
            }
            result_dict = dict()
            result_dict["sector_element"] = []
            result_dict["faction"] = {
                "name": sector.faction_sector.name,
                "faction_id": sector.faction_id,
                "is_faction_level_starter": sector.is_faction_level_starter,
            }
            result_dict["sector"] = {
                "id": pk,
                "name": sector.name,
                "description": sector.description,
                "image": sector.image,
                "security_id": sector.security_id,
            }

            for table_key, table_value in table_set.items():
                for table in table_value:
                    item_name = ""
                    match table_key:
                        case "planet":
                            item_name = Planet.objects.filter(
                                id=table.source_id
                            ).values_list("name", flat=True)[0]
                        case "satellite":
                            item_name = Planet.objects.filter(
                                id=table.source_id,
                                data__contains={"type": "satellite"},
                            ).values_list("name", flat=True)[0]
                        case "blackhole":
                            item_name = Planet.objects.filter(
                                id=table.source_id,
                                data__contains={"type": "blackhole"},
                            ).values_list("name", flat=True)[0]
                        case "star":
                            item_name = Planet.objects.filter(
                                id=table.source_id,
                                data__contains={"type": "star"},
                            ).values_list("name", flat=True)[0]
                        case "asteroid":
                            item_name = Asteroid.objects.filter(
                                id=table.source_id
                            ).values_list("name", flat=True)[0]
                        case "station":
                            item_name = Station.objects.filter(
                                id=table.source_id
                            ).values_list("name", flat=True)[0]
                        case "warpzone":
                            item_name = Warp.objects.filter(
                                id=table.source_id
                            ).values_list("name", flat=True)[0]
                    result_dict["sector_element"].append(
                        {
                            "type": table_key,
                            "item_id": table.id,
                            "item_name": item_name,
                            "resource_id": table.resource_id,
                            "source_id": table.source_id,
                            "sector_id": table.sector_id,
                            "data": table.data,
                        }
                    )

            return JsonResponse(json.dumps(result_dict), safe=False)
        return JsonResponse({}, safe=False)


class SectorUpdateDataView(LoginRequiredMixin, UpdateView):
    model = Sector

    def post(self, request, *args, **kwargs):
        data_from_post = json.load(request)
        pk = data_from_post["map_data"]["sector_id"]
        sector_name = Sector.objects.filter(id=pk).values_list("name", flat=True)[0]
        response = {"success": False}
        (
            data_is_missing,
            missing_data_response,
        ) = GetDataFromDB.check_if_no_missing_entry(
            data_from_post["map_data"],
            data_item=data_from_post["data"],
        )
        if data_is_missing is False:
            if GetDataFromDB.check_if_table_pk_exists("sector", pk):
                Sector.objects.filter(id=pk).update(
                    name=data_from_post["map_data"]["sector_name"],
                    description=data_from_post["map_data"]["sector_description"],
                    image=data_from_post["map_data"]["sector_background"],
                    security_id=data_from_post["map_data"]["security"],
                    faction_id=data_from_post["map_data"]["faction_id"],
                    is_faction_level_starter=data_from_post["map_data"][
                        "is_faction_starter"
                    ],
                )

                GetDataFromDB.delete_items_from_sector(pk)

                for item, _ in data_from_post["data"].items():
                    item_type = data_from_post["data"][item]["item_type"]
                    item_img_name = data_from_post["data"][item]["item_img_name"]
                    table, table_resource = GetDataFromDB.get_table(item_type)
                    rsrc_data_list = data_from_post["data"][item]["resource_data"]
                    for rsrc in rsrc_data_list:
                        item_type_id = table.objects.filter(
                            name=item_img_name
                        ).values_list("id", flat=True)[0]
                        resource_id = 1 if rsrc == "none" else rsrc
                        table_resource.objects.create(
                            sector_id=pk,
                            resource_id=resource_id,
                            source_id=item_type_id,
                            data={
                                "coord_x": data_from_post["data"][item]["coord_x"],
                                "coord_y": data_from_post["data"][item]["coord_y"],
                                "name": data_from_post["data"][item]["item_name"],
                                "description": data_from_post["data"][item][
                                    "item_description"
                                ],
                            },
                        )

                messages.success(
                    self.request,
                    f'Sector with name {data_from_post["map_data"]["sector_name"]} edited with success',
                )
                response = {"success": True}
            else:
                messages.error(
                    self.request,
                    f"Error can't edit {sector_name}, sector does not exists",
                )

        else:
            messages.error(
                self.request,
                f'Error can\'t edit {sector_name}, missing : {", ".join(missing_data_response)}',
            )
        return JsonResponse(json.dumps(response), safe=False)


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
            "REPAIR",
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
        module_bonus_hp = module_dict["HULL"]["hull_hp"] if "HULL" in module_dict else 0
        module_bonus_move = (
            module_dict["MOVEMENT"]["bonus_mvt"] if "MOVEMENT" in module_dict else 0
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
            + (50 * (int(skill_dict["Repair"]["level"]) / 100))
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
                module_dict["HULL"]["hull_hp"] if "HULL" in module_dict else 0
            )
            module_bonus_move = (
                module_dict["MOVEMENT"]["bonus_mvt"] if "MOVEMENT" in module_dict else 0
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
                + (50 * (int(skill_dict["Repair"]["level"]) / 100))
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


class NpcToSectorView(LoginRequiredMixin, TemplateView):
    template_name = "generate_npc_on_sector.html"
    model = NpcTemplate

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        context["map_size_range"] = GetDataFromDB.get_map_size_range()
        context["map_size"] = GetDataFromDB.get_map_size()
        context["sector_data"] = GetDataFromDB.get_table("sector").objects.values(
            "id", "name"
        )
        context["npc_template"] = GetDataFromDB.get_template_data()
        context["size"] = GetDataFromDB.get_size()

        return context

    def post(self, request, **kwargs):
        pk = json.load(request)["map_id"]
        if Sector.objects.filter(id=pk).exists():
            sector = Sector.objects.get(id=pk)
            planets, asteroids, stations = GetDataFromDB.get_items_from_sector(pk)
            table_set = {
                "planet": planets,
                "asteroid": asteroids,
                "station": stations,
            }
            result_dict = dict()
            result_dict["sector_element"] = []
            result_dict["sector"] = {
                "image": sector.image,
            }
            result_dict["npc"] = GetDataFromDB.get_related_npc_on_sector_data(pk)
            for table_key, table_value in table_set.items():
                for table in table_value:
                    item_data = ""
                    match table_key:
                        case "planet":
                            item_data = Planet.objects.filter(
                                id=table.source_id
                            ).values_list("name", "data", "size")[0]
                        case "satellite":
                            item_data = Planet.objects.filter(
                                id=table.source_id,
                                data__contains={"type": "satellite"},
                            ).values_list("name", "data", "size")[0]
                        case "blackhole":
                            item_data = Planet.objects.filter(
                                id=table.source_id,
                                data__contains={"type": "blackhole"},
                            ).values_list("name", "data", "size")[0]
                        case "star":
                            item_data = Planet.objects.filter(
                                id=table.source_id,
                                data__contains={"type": "star"},
                            ).values_list("name", "data", "size")[0]
                        case "asteroid":
                            item_data = Asteroid.objects.filter(
                                id=table.source_id
                            ).values_list("name", "data", "size")[0]
                        case "station":
                            item_data = Station.objects.filter(
                                id=table.source_id
                            ).values_list("name", "data", "size")[0]
                        case "warpzone":
                            item_data = Warp.objects.filter(
                                id=table.source_id
                            ).values_list("name", "data", "size")[0]
                    result_dict["sector_element"].append(
                        {
                            "type": table_key,
                            "item_id": table.id,
                            "item_data": item_data,
                            "resource_id": table.resource_id,
                            "source_id": table.source_id,
                            "sector_id": table.sector_id,
                            "data": table.data,
                        }
                    )
            return JsonResponse(json.dumps(result_dict), safe=False)
        return JsonResponse(json.dumps({}), safe=False)
    
    
class NpcToSectorShipDataView(LoginRequiredMixin, TemplateView):
    template_name = "generate_npc_on_sector.html"
    model = Npc

    def post(self, request, **kwargs):
        pk = json.load(request)["template_id"]
        result_dict = GetDataFromDB.get_selected_ship_data(pk)
        result_dict["template_pk"] = pk
        return JsonResponse(json.dumps(result_dict), safe=False)
    

class NpcToSectorUpdateDataView(LoginRequiredMixin, TemplateView):
    template_name = "generate_npc_on_sector.html"
    model = Npc
    
    def post(self, request, **kwargs):
        recieved_data = json.load(request)
        
        npc_list = Npc.objects.filter(sector_id=recieved_data['map_id'])
        if npc_list.exists():
            npc_list.delete()
        
        for d in recieved_data['data']:
            npc_template = NpcTemplate.objects.filter(id=d['data']['template_pk']).values(
                'id',
                'max_hp',
                'max_movement',
                'max_missile_defense',
                'max_thermal_defense',
                'max_ballistic_defense'
            )[0]
            
            Npc.objects.create(
                hp=npc_template['max_hp'],
                movement=npc_template['max_movement'],
                missile_defense=npc_template['max_missile_defense'],
                thermal_defense=npc_template['max_thermal_defense'],
                ballistic_defense=npc_template['max_ballistic_defense'],
                coordinates=d['pos'],
                current_ap=10,
                max_ap=10,
                status="FULL",
                sector_id=recieved_data['map_id'],
                npc_template_id=npc_template['id'],
                faction_id=1
            )
        return JsonResponse(json.dumps({}), safe=False)


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


@admin.register(PlayerPrivateMessage, site=admin_site)
class PlayerPrivateMessageAdmin(admin.ModelAdmin):
    model = PlayerPrivateMessage


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
