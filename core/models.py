from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

localtime = timezone.now


def get_default_planet_size():
    return {"x": 4, "y": 4}


def get_default_station_size():
    return {"x": 3, "y": 3}


def get_default_asteroid_size():
    return {"x": 1, "y": 1}

def get_default_warzone_size():
    return {"x": 2, "y": 3}

# Model to store the list of logged in users
class LoggedInUser(models.Model):
    user = models.OneToOneField(User, related_name='logged_in_user', on_delete=models.CASCADE)
    # Session keys are 32 characters long
    session_key = models.CharField(max_length=32, null=True, blank=True)

    def __str__(self):
        return self.user.username


class CashShop(models.Model):
    pass


class UserPurchase(models.Model):
    pass


class Resource(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Resource-default"
    )
    data = models.JSONField(null=True)
    takes_inventory_space = models.BooleanField(default=True)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.data}"


class Planet(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Planet-default"
    )
    data = models.JSONField(null=True)
    size = models.JSONField(default=get_default_planet_size)
    created_at = models.DateTimeField(default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Station(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Station-default"
    )
    data = models.JSONField(null=True)
    size = models.JSONField(default=get_default_station_size)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Asteroid(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Asteroid-default"
    )
    data = models.JSONField(null=True)
    size = models.JSONField(default=get_default_asteroid_size)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Faction(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Faction-default"
    )
    data = models.JSONField(null=True)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_default_pk(cls):
        faction = cls.objects.get_or_create(
            name="none",
        )
        return faction

    def __str__(self):
        return f"{self.name}"


class Security(models.Model):
    name = models.CharField(max_length=30)
    description = models.TextField()
    attack_countdown = models.PositiveSmallIntegerField(default=3)
    chance_to_intervene = models.PositiveSmallIntegerField(default=100)
    ship_quantity = models.PositiveSmallIntegerField(default=3)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)


class Sector(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Sector")
    image = models.CharField(max_length=250, null=False, blank=False, default="default.gif")
    description = models.TextField(max_length=2500, blank=True)
    security = models.ForeignKey(
        Security,
        on_delete=models.SET_DEFAULT,
        null=False,
        default=1,
        related_name="security_sector",
    )
    faction = models.ForeignKey(
        Faction,
        on_delete=models.SET_DEFAULT,
        null=False,
        default=Faction.get_default_pk,
        related_name="faction_sector",
    )
    is_tutorial_zone = models.BooleanField(default=False)
    is_faction_level_starter = models.BooleanField(default=False)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} : {self.faction.name}, is_faction_level_starter : {self.is_faction_level_starter}"
    
class Warp(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Warp")
    data = models.JSONField(null=True)
    size = models.JSONField(default=get_default_warzone_size)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"
    
class WarpZone(models.Model):
    data = models.JSONField(null=True)
    coordinates = models.JSONField(null=True)
    source = models.ForeignKey(Warp, on_delete=models.CASCADE, default=1)
    sector = models.ForeignKey(Sector, on_delete=models.CASCADE, related_name="warp_sector")
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"name: {self.name}, sector_src = {self.sector.name }, warp_img_name = {self.source.name}"
    
class SectorWarpZone(models.Model):
    warp_home = models.ForeignKey(WarpZone, on_delete=models.CASCADE, related_name="warp_home")
    warp_destination = models.ForeignKey(WarpZone, on_delete=models.CASCADE, related_name="warp_destination")
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"from {self.warp_home.name } ({ self.warp_home.sector.name }) to {self.warp_destination.name} ({self.warp_destination.sector.name})"
    

class ShipCategory(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Light Cruiser"
    )
    description = models.TextField(max_length=2500, blank=True)
    size = models.JSONField(null=True)
    ship_category_hp = models.IntegerField(default=0, blank=False, null=False)
    ship_category_movement = models.IntegerField(default=0, blank=False, null=False)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Ship(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False)
    description = models.TextField(max_length=2500, blank=True)
    image = models.CharField(max_length=250, null=False, blank=False, default="img.png")
    module_slot_available = models.PositiveIntegerField(default=10)
    
    default_hp = models.PositiveSmallIntegerField(default=100)
    default_movement = models.PositiveSmallIntegerField(default=10)
    ship_category = models.ForeignKey(
        ShipCategory, on_delete=models.SET_NULL, null=True
    )
    default_ballistic_defense = models.PositiveSmallIntegerField(default=0)
    default_thermal_defense = models.PositiveSmallIntegerField(default=0)
    default_missile_defense = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"
    
    
class ShipModuleLimitation(models.Model):
    ship = models.ForeignKey(Ship, on_delete=models.CASCADE, related_name="ship_module_limitation", null=True)
    defense_module_limitation = models.PositiveSmallIntegerField(default=3) 
    weaponry_module_limitation = models.PositiveSmallIntegerField(default=1)
    probe_module_limitation = models.PositiveSmallIntegerField(default=1)
    hold_module_limitation = models.PositiveSmallIntegerField(default=1)
    movement_module_limitation = models.PositiveSmallIntegerField(default=1)
    hull_module_limitation = models.PositiveSmallIntegerField(default=1)
    repair_module_limitation = models.PositiveSmallIntegerField(default=1)
    gathering_module_limitation = models.PositiveSmallIntegerField(default=1)
    craft_module_limitation = models.PositiveSmallIntegerField(default=1)
    research_module_limitation = models.PositiveSmallIntegerField(default=1)
    electronic_warfare_module_limitation = models.PositiveSmallIntegerField(default=1)
    colonization_module_limitation = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)


class Archetype(models.Model):
    name = models.CharField(max_length=30)
    description = models.TextField(max_length=2500, blank=True)
    data = models.JSONField(null=True)
    ship = models.ForeignKey(Ship, on_delete=models.CASCADE, related_name="default_ship", null=True)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Player(models.Model):
    STATUS_CHOICES = (
        ("ALIVE", "alive"),
        ("DEAD", "dead"),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    faction = models.ForeignKey(
        Faction,
        on_delete=models.SET_DEFAULT,
        null=False,
        default=Faction.get_default_pk,
        related_name="player_faction",
    )
    sector = models.ForeignKey(
        Sector,
        on_delete=models.SET_NULL,
        null=True,
        related_name="player_sector",
    )
    is_npc = models.BooleanField(default=False)
    name = models.CharField(max_length=30, null=False, blank=False, default="Faction")
    description = models.TextField(max_length=2500, blank=True)
    image = models.BooleanField(default=False)
    faction_xp = models.PositiveIntegerField(null=False, default=0)
    archetype = models.ForeignKey(
        Archetype,
        on_delete=models.CASCADE,
        default=1,
        related_name="player_archetype",
    )
    current_ap = models.PositiveIntegerField(default=10)
    max_ap = models.PositiveBigIntegerField(default=10)
    credit_amount = models.FloatField(default=0.0)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_CHOICES[0][0]
    )
    coordinates = models.JSONField(null=True)
    last_time_warpzone = models.DateTimeField(default=timezone.now, auto_now=False)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - (user:{self.user.username}, {self.user}) : {self.archetype.name}"


class Skill(models.Model):
    SKILL_CATEGORIES_CHOICES = (
        ("STEERING", "steering"),
        ("OFFENSIVE", "offensive"),
        ("DEFENSIVE", "defensive"),
        ("UTILITY", "utility"),
        ("INDUSTRY", "industry"),
    )
    name = models.CharField(max_length=30, null=False, blank=False, default="Skill1")
    description = models.TextField(max_length=2500, blank=True)
    category = models.CharField(
        max_length=30,
        choices=SKILL_CATEGORIES_CHOICES,
        default=SKILL_CATEGORIES_CHOICES[0],
    )
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"
    
class SkillExperience(models.Model):
    level = models.PositiveSmallIntegerField(default=0)
    required_experience = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)


class SkillEffect(models.Model):
    EXPERTISE_CHOICE = (
        ("ROOKIE", "Rookie"),
        ("QUALIFIED", "Qualified"),
        ("PROFESSIONAL", "Professional"),
        ("EXPERT", "Expert"),
        ("GREAT_EXPERT", "Great expert"),
        ("MASTER", "Master"),
        ("GRAND_MASTER", "Grand master"),
    )

    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    min_level_range = models.PositiveIntegerField(default=0)
    max_level_range = models.PositiveIntegerField(default=1)
    effect = models.JSONField(null=True)
    expertise = models.CharField(
        max_length=20, choices=EXPERTISE_CHOICE, default=EXPERTISE_CHOICE[0]
    )
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.skill.name} [{self.min_level_range} - {self.max_level_range}] expertise = {self.expertise}"


class Recipe(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Recipe1")
    description = models.TextField(max_length=2500, blank=True)
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True)
    value_needed = models.FloatField(default=1.0, null=False, blank=False)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Research(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Recipe1")
    description = models.TextField(max_length=2500, blank=True)
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True)
    image = models.CharField(max_length=250, null=False, blank=False, default="img.png")
    time_to_complete = models.PositiveIntegerField(default=(60 * 60) * 24)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Log(models.Model):
    LOG_TYPE_CHOICES = (
        ("ATTACK", "attack"),
        ("DEFENSE", "defense"),
        ("SCAN", "scan"),
        ("ZONE_CHANGE", "zone change"),
        ("DEATH", "death"),
        ("KILL", "kill"),
        ("CRAFT", "craft"),
        ("RESEARCH", "research"),
        ("LEVEL_UP", "level up"),
        ("OTHER", "other"),
    )
    content = models.JSONField(null=True)
    log_type = models.CharField(
        max_length=20, choices=LOG_TYPE_CHOICES, default=LOG_TYPE_CHOICES[0]
    )
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.log_type}: {self.content}"


class NpcTemplate(models.Model):
    BEHAVIOR_CHOICES = (
        ("PASSIVE", "passive"),
        ("CLOSE_RANGE", "close range"),
        ("MIDDLE_RANGE", "middle range"),
        ("LONG_RANGE", "long range"),
        ("SUPPORT", "support"),
        ("DEFENSIVE", "defensive"),
    )

    ship = models.ForeignKey(Ship, on_delete=models.SET_NULL, null=True)
    displayed_name = models.CharField(max_length=50, null=True)
    name = models.CharField(max_length=50)
    difficulty = models.SmallIntegerField(default=1)
    description = models.TextField(max_length=2500, blank=True)
    module_id_list = models.JSONField(null=True)
    max_hp = models.SmallIntegerField(default=100)
    max_movement = models.PositiveSmallIntegerField(default=10)
    max_missile_defense = models.SmallIntegerField(default=0)
    max_thermal_defense = models.SmallIntegerField(default=0)
    max_ballistic_defense = models.SmallIntegerField(default=0)
    hold_capacity = models.SmallIntegerField(default=2)
    # Respawn delay in seconds for NPC instances using this template.
    # Default stays short for tests/dev; gameplay values can be raised per template.
    respawn_delay_seconds = models.PositiveIntegerField(default=120)
    behavior = models.CharField(
        max_length=20, choices=BEHAVIOR_CHOICES, default=BEHAVIOR_CHOICES[0]
    )
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - diff : {self.difficulty}, behavior : {self.behavior}"


class NpcTemplateSkill(models.Model):
    npc_template = models.ForeignKey(NpcTemplate, on_delete=models.SET_NULL, null=True)
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True)
    level = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.npc_template.name} - {self.skill.name} ({self.level})"


class NpcTemplateResource(models.Model):
    npc_template = models.ForeignKey(NpcTemplate, on_delete=models.SET_NULL, null=True)
    faction_xp = models.PositiveIntegerField(null=False, default=0)
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1)
    can_be_randomized = models.BooleanField(default=False)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.npc_template.name} - {self.resource.name} ({self.quantity})"


class Npc(models.Model):
    STATUS_CHOICES = (
        ("FULL", "pleine forme"),
        ("WOUNDED", "blesse"),
        ("DEAD", "mort"),
    )
    faction = models.ForeignKey(
        Faction,
        on_delete=models.SET_DEFAULT,
        null=False,
        default=Faction.get_default_pk,
        related_name="npc_faction",
    )
    sector = models.ForeignKey(
        Sector,
        on_delete=models.SET_NULL,
        null=True,
        related_name="npc_sector",
    )
    npc_template = models.ForeignKey(NpcTemplate, on_delete=models.SET_NULL, null=True)
    current_ap = models.PositiveIntegerField(default=10)
    max_ap = models.PositiveBigIntegerField(default=10)
    hp = models.SmallIntegerField(default=0)
    movement = models.PositiveSmallIntegerField(default=0)
    missile_defense = models.SmallIntegerField(default=0)
    thermal_defense = models.SmallIntegerField(default=0)
    ballistic_defense = models.SmallIntegerField(default=0)
    coordinates = models.JSONField(null=True)
    spawn_coordinates = models.JSONField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_CHOICES[0]
    )
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sector.name} - {self.npc_template.name} : {self.coordinates}"


class NpcResource(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, default=1)
    npc = models.ForeignKey(Npc, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)


class Module(models.Model):
    MODULE_TYPE_CHOICES = (
        ("NONE", "none"),
        ("WEAPONRY", "weaponry"),
        ("DEFENSE_BALLISTIC", "defense_ballistic"),
        ("DEFENSE_THERMAL", "defense_thermal"),
        ("DEFENSE_MISSILE", "defense_missile"),
        ("HULL", "hull"),
        ("MOVEMENT", "movement"),
        ("GATHERING", "gathering"),
        ("PROBE", "probe"),
        ("REPAIRE", "repaire"),
        ("ELECTRONIC_WARFARE", "electronic warfare"),
        ("RESEARCH", "research"),
        ("CRAFT", "craft"),
        ("HOLD", "hold"),
        ("COLONIZATION", "colonization"),
    )

    name = models.CharField(
        max_length=30, null=False, blank=False, default="Light Cruiser"
    )
    description = models.TextField(max_length=2500, blank=True)
    tier = models.SmallIntegerField(null=False, blank=False, default=1)
    type = models.CharField(
        max_length=30,
        choices=MODULE_TYPE_CHOICES,
        default=MODULE_TYPE_CHOICES[0][0],
    )
    effect = models.JSONField(null=True)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.type}"
    
    
class ArchetypeModule(models.Model):
    archetype = models.ForeignKey(Archetype, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.archetype.name} - {self.module.name} [{self.module.effect}]"


class PlayerLog(models.Model):
    
    ROLE_TYPE_CHOICES = (
        ("TRANSMITTER", "transmitter"),
        ("RECEIVER", "receiver"),
        ("OBSERVER", "observer"),
    )
    
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    log = models.ForeignKey(Log, on_delete=models.CASCADE)
    role = models.CharField(
        max_length=30,
        choices=ROLE_TYPE_CHOICES,
        default="TRANSMITTER"
    )
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} - {self.role} : {self.log}"


class PlayerResource(models.Model):
    source = models.ForeignKey(Player, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.source.name} : {self.resource.name}"


class PlayerRecipe(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.recipe.name}"


class PlayerSkill(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, default=1)
    level = models.PositiveIntegerField(default=0)
    progress = models.FloatField(default=0.0)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.skill.name}, level = {self.level}"


class PlayerResearch(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    research = models.ForeignKey(Research, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.research.name}"


class PlayerShip(models.Model):
    STATUS_CHOICES = (
        ("FULL", "pleine forme"),
        ("WOUNDED", "blesse"),
        ("DEAD", "mort"),
    )

    ship = models.ForeignKey(Ship, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    is_current_ship = models.BooleanField(default=True)
    is_reversed = models.BooleanField(default=False)
    current_hp = models.SmallIntegerField(default=100)
    max_hp = models.SmallIntegerField(default=100)
    current_movement = models.PositiveSmallIntegerField(default=10)
    max_movement = models.PositiveSmallIntegerField(default=10)
    current_missile_defense = models.SmallIntegerField(default=0)
    current_thermal_defense = models.SmallIntegerField(default=0)
    current_ballistic_defense = models.SmallIntegerField(default=0)
    max_missile_defense = models.SmallIntegerField(default=0)
    max_thermal_defense = models.SmallIntegerField(default=0)
    max_ballistic_defense = models.SmallIntegerField(default=0)
    current_cargo_size = models.SmallIntegerField(default=2)
    credit_amount = models.FloatField(default=0.0)
    view_range = models.SmallIntegerField(default=6)
    equipment_blocked_until = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_CHOICES[0]
    )
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.ship.name} : {self.player.name}"


class PlayerShipResource(models.Model):
    source = models.ForeignKey(PlayerShip, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, null=True)
    quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.source.name} - {self.resource.name} - quantity : {self.quantity}"
    

class PlayerShipInventoryModule(models.Model):
    player_ship = models.ForeignKey(
        PlayerShip,
        related_name="inventory_modules",
        on_delete=models.CASCADE,
    )
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player_ship.player.name} - cargo module : {self.module.name}"
    
    
class PlayerShipModule(models.Model):
    player_ship = models.ForeignKey(PlayerShip, related_name="player_ship_module", on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player_ship.player.name} - {self.player_ship.ship.name} - module : {self.module.name}"


class PlayerShipModuleReconfiguration(models.Model):
    ACTION_TYPE_CHOICES = (
        ("EQUIP", "equip"),
        ("UNEQUIP", "unequip"),
    )
    STATUS_CHOICES = (
        ("PENDING", "pending"),
        ("COMPLETED", "completed"),
        ("FAILED", "failed"),
    )

    player_ship = models.ForeignKey(
        PlayerShip,
        related_name="module_reconfigurations",
        on_delete=models.CASCADE,
    )
    requested_by_player = models.ForeignKey(
        Player,
        related_name="module_reconfigurations",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    action_type = models.CharField(max_length=10, choices=ACTION_TYPE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="PENDING", db_index=True)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    equipped_module_entry = models.ForeignKey(
        PlayerShipModule,
        related_name="reconfiguration_events",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    inventory_module_entry = models.ForeignKey(
        PlayerShipInventoryModule,
        related_name="reconfiguration_events",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    execute_at = models.DateTimeField(db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["player_ship", "status", "execute_at"]),
        ]

    def __str__(self):
        return f"{self.player_ship_id} {self.action_type} {self.module_id} ({self.status})"


class ShipWreck(models.Model):
    ORIGIN_TYPE_CHOICES = (
        ("PC", "player"),
        ("NPC", "npc"),
    )

    STATUS_CHOICES = (
        ("ACTIVE", "active"),
        ("LOOTED", "looted"),
        ("SALVAGED", "salvaged"),
        ("EXPIRED", "expired"),
    )

    origin_type = models.CharField(
        max_length=10, choices=ORIGIN_TYPE_CHOICES, default=ORIGIN_TYPE_CHOICES[0]
    )
    origin_player = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ship_wrecks_origin",
    )
    origin_npc = models.ForeignKey(
        Npc,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ship_wrecks_origin",
    )
    killer_player = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ship_wrecks_kills",
    )
    sector = models.ForeignKey(
        Sector,
        on_delete=models.SET_NULL,
        null=True,
        related_name="ship_wrecks",
    )
    ship = models.ForeignKey(
        Ship,
        on_delete=models.SET_NULL,
        null=True,
        related_name="ship_wrecks",
    )
    coordinates = models.JSONField(null=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_CHOICES[0]
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        ship_name = self.ship.name if self.ship else "Unknown ship"
        return f"Wreck<{self.id}> {ship_name} [{self.origin_type}]"


class FactionLeader(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    faction = models.ForeignKey(Faction, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.faction.name} : {self.player.name}"


class FactionResource(models.Model):
    source = models.ForeignKey(Faction, on_delete=models.CASCADE)
    resource = resource = models.ForeignKey(
        Resource, on_delete=models.SET_NULL, null=True
    )
    sector = models.ForeignKey(
        Sector, on_delete=models.CASCADE, related_name="faction_sector"
    )
    quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.source.name} : {self.resource.name}, quantity : {self.quantity}"


class FactionRank(models.Model):
    faction = models.ForeignKey(Faction, on_delete=models.CASCADE)
    name = models.CharField(max_length=30, null=False, blank=False, default="Rank1")
    description = models.TextField(max_length=2500, blank=True)
    responsibility_level = models.PositiveSmallIntegerField(default=0)
    faction_xp_required = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.faction.name} : {self.name}"


class PlanetResource(models.Model):
    source = models.ForeignKey(Planet, on_delete=models.CASCADE)
    resource = resource = models.ForeignKey(
        Resource, on_delete=models.SET_NULL, null=True
    )
    sector = models.ForeignKey(
        Sector, on_delete=models.CASCADE, related_name="planet_sector"
    )
    quantity = models.PositiveIntegerField(default=0)
    data = models.JSONField(null=True)
    coordinates = models.JSONField(null=True)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.source.name} : {self.resource.name}"


class AsteroidResource(models.Model):
    source = models.ForeignKey(Asteroid, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True)
    sector = models.ForeignKey(
        Sector, on_delete=models.CASCADE, related_name="asteroid_sector"
    )
    quantity = models.PositiveIntegerField(default=0)
    data = models.JSONField(null=True)
    coordinates = models.JSONField(null=True)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.source.name} : {self.resource.name}"


class StationResource(models.Model):
    source = models.ForeignKey(Station, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True)
    sector = models.ForeignKey(
        Sector, on_delete=models.CASCADE, related_name="station_sector"
    )
    data = models.JSONField(null=True)
    coordinates = models.JSONField(null=True)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.source.name} : {self.resource.name}"

class PrivateMessage(models.Model):
    PRIORITY_CHOICES = (
        ('LOW', 'Basse'),
        ('NORMAL', 'Normale'),
        ('HIGH', 'Haute'),
        ('URGENT', 'Urgente'),
    )
    
    sender = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='sent_messages')
    subject = models.CharField(max_length=120)
    body = models.TextField()
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES, 
        default='LOW'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    deleted_at = models.DateTimeField("delete date", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['priority', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        return f"[{self.priority}] {self.subject} ({self.sender.name})"
    
class PrivateMessageRecipients(models.Model):
    recipient = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='recipient')
    message = models.ForeignKey(PrivateMessage, on_delete=models.CASCADE, related_name='received_messages') 
    is_read = models.BooleanField(default=False)
    is_author = models.BooleanField(default=False)
    created_at = models.DateTimeField("creation date", default=timezone.now)
    deleted_at = models.DateTimeField("delete date", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
class Group(models.Model):
    creator = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="created_groups")
    name = models.CharField(max_length=50, default="Unnamed Group")
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (by {self.creator.name})"


class PlayerGroup(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="group_memberships")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="members")
    created_at = models.DateTimeField("creation date", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} in {self.group.name}"
    
    
class Message(models.Model):
    """Message unique avec canal intégré"""
    CHANNEL_CHOICES = (
        ("SECTOR", "sector"),
        ("FACTION", "faction"),
        ("GROUP", "group"),
    )
    
    author = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="messages")
    content = models.TextField(max_length=2000)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default="SECTOR")
    
    # Relations selon le canal (nullable car dépend du type)
    sector = models.ForeignKey(Sector, on_delete=models.CASCADE, null=True, related_name="sector_messages")
    faction = models.ForeignKey(Faction, on_delete=models.CASCADE, null=True, related_name="faction_messages")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, related_name="group_messages")
    
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['channel', 'sector', '-created_at']),
            models.Index(fields=['channel', 'faction', '-created_at']),
            models.Index(fields=['channel', 'group', '-created_at']),
        ]

    def __str__(self):
        return f"{self.channel} message by {self.author.name}: {self.content[:30]}..."


class MessageReadStatus(models.Model):
    """Table de tracking de lecture par joueur"""
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="message_read_statuses")
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="read_by")
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('player', 'message')
        indexes = [
            models.Index(fields=['player', 'is_read']),
            models.Index(fields=['message', 'is_read']),
        ]

    def __str__(self):
        return f"{self.player.name} - Message {self.message.id} - Read: {self.is_read}"
    
    def mark_as_read(self):
        """Marque le message comme lu"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
            
            
class ScanEffect(models.Model):
    SCAN_TARGET_TYPE = (
        ("pc", "Player"),
        ("npc", "NPC"),
        ("foreground", "Foreground")
    )

    scanner = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="scans_emitted"
    )

    target_type = models.CharField(max_length=12, choices=SCAN_TARGET_TYPE)
    target_id = models.PositiveIntegerField()

    sector = models.ForeignKey(
        Sector,
        on_delete=models.CASCADE
    )

    expires_at = models.DateTimeField()
    invalidated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["scanner", "target_type", "target_id"]),
            models.Index(fields=["expires_at"]),
        ]
        
class ScanIntel(models.Model):
    SCAN_TARGET_TYPES = (
        ("pc", "pc"),
        ("npc", "npc"),
    )

    scanner_player_id = models.IntegerField(db_index=True)  # player_id de l'auteur
    target_type = models.CharField(max_length=8, choices=SCAN_TARGET_TYPES)
    target_id = models.IntegerField(db_index=True)          # id pc/npc selon target_type
    sector_id = models.IntegerField(db_index=True)          # secteur où la cible était au moment du scan
    
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(db_index=True)
    invalidated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["scanner_player_id", "sector_id"]),
            models.Index(fields=["target_type", "target_id", "sector_id"]),
        ]

    def is_active(self):
        return timezone.now() < self.expires_at
    
class ScanIntelGroup(models.Model):
    # partage (pour plus tard / déjà utile avec share_scan)
    scan = models.ForeignKey(ScanIntel, on_delete=models.CASCADE, related_name="scan_to_group")
    group = models.ForeignKey(PlayerGroup, on_delete=models.CASCADE, related_name="group_reciever")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("scan", "group")
        indexes = [
            models.Index(fields=["group"]),
        ]
