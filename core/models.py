from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

localtime = timezone.now


def get_default_planet_size():
    return {"size_x": 4, "size_y": 4}


def get_default_station_size():
    return {"size_x": 3, "size_y": 3}


def get_default_asteroid_size():
    return {"size_x": 1, "size_y": 1}


class CashShop(models.Model):
    pass


class UserPurchase(models.Model):
    pass


class Resource(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Resource-default"
    )
    data = models.JSONField(null=True)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.data}"


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
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Asteroid(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Asteroid-default"
    )
    data = models.JSONField(null=True)
    size = models.JSONField(default=get_default_asteroid_size)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Faction(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Faction-default"
    )
    data = models.JSONField(null=True)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_default_pk(cls):
        faction = cls.objects.get_or_create(
            name="none",
        )
        return faction.pk

    def __str__(self):
        return f"{self.name}"


class Security(models.Model):
    name = models.CharField(max_length=30)
    description = models.TextField()
    attack_countdown = models.PositiveSmallIntegerField(default=3)
    chance_to_intervene = models.PositiveSmallIntegerField(default=100)
    ship_quantity = models.PositiveSmallIntegerField(default=3)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)


class Sector(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Sector")
    image = models.CharField(max_length=250, null=False, blank=False, default="img.png")
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
    is_faction_level_starter = models.BooleanField(default=False)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} : {self.faction.name}, is_faction_level_starter : {self.is_faction_level_starter}"


class Archetype(models.Model):
    name = models.CharField(max_length=30)
    description = models.TextField(max_length=2500, blank=True)
    data = models.JSONField(null=True)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Player(models.Model):
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
    image = models.CharField(max_length=250, null=True, blank=True, default="img.png")
    faction_xp = models.PositiveIntegerField(null=False, default=0)
    archetype = models.ForeignKey(
        Archetype,
        on_delete=models.CASCADE,
        default=1,
        related_name="player_archetype",
    )
    current_ap = models.PositiveIntegerField(default=10)
    max_ap = models.PositiveBigIntegerField(default=10)
    coordinates = models.JSONField()
    created_at = models.DateTimeField("creation date", default=localtime)
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
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


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
    effect = models.JSONField()
    expertise = models.CharField(
        max_length=20, choices=EXPERTISE_CHOICE, default=EXPERTISE_CHOICE[0]
    )
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.skill.name} [{self.min_level_range} - {self.max_level_range}] expertise = {self.expertise}"


class Recipe(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Recipe1")
    description = models.TextField(max_length=2500, blank=True)
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True)
    value_needed = models.FloatField(default=1.0, null=False, blank=False)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Research(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Recipe1")
    description = models.TextField(max_length=2500, blank=True)
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True)
    image = models.CharField(max_length=250, null=False, blank=False, default="img.png")
    time_to_complete = models.PositiveIntegerField(default=(60 * 60) * 24)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Log(models.Model):
    LOG_TYPE_CHOICES = (
        ("ATTACK", "attack"),
        ("DEFENSE", "defense"),
        ("ZONE_CHANGE", "zone change"),
        ("DEATH", "death"),
        ("KILL", "kill"),
        ("CRAFT_END", "craft end"),
        ("RESEARCH_END", "research end"),
        ("LEVEL_UP", "level up"),
    )
    content = models.TextField(max_length=2500, blank=True)
    log_type = models.CharField(
        max_length=20, choices=LOG_TYPE_CHOICES, default=LOG_TYPE_CHOICES[0]
    )
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.log_type}: {self.content}"


class ShipCategory(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Light Cruiser"
    )
    description = models.TextField(max_length=2500, blank=True)
    ship_size = models.JSONField(null=True)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Ship(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False)
    description = models.TextField(max_length=2500, blank=True)
    image = models.CharField(max_length=250, null=False, blank=False, default="img.png")
    module_slot_available = models.PositiveIntegerField(default=4)
    default_hp = models.PositiveSmallIntegerField(default=100)
    default_movement = models.PositiveSmallIntegerField(default=10)
    ship_category = models.ForeignKey(
        ShipCategory, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class NpcTemplate(models.Model):
    STATUS_CHOICES = (
        ("FULL", "pleine forme"),
        ("WOUNDED", "blesse"),
        ("DEAD", "mort"),
    )

    ship = models.ForeignKey(Ship, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=50)
    difficulty = models.SmallIntegerField(default=0)
    description = models.TextField(max_length=2500, blank=True)
    module_id_list = models.JSONField(null=True)
    current_hp = models.SmallIntegerField(default=100)
    max_hp = models.SmallIntegerField(default=100)
    current_movement = models.PositiveSmallIntegerField(default=10)
    max_movement = models.PositiveSmallIntegerField(default=10)
    current_missile_defense = models.SmallIntegerField(default=0)
    current_thermal_defense = models.SmallIntegerField(default=0)
    current_ballistic_defense = models.SmallIntegerField(default=0)
    current_cargo_size = models.SmallIntegerField(default=2)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_CHOICES[0]
    )
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class NpcTemplateSkill(models.Model):
    npc_template = models.ForeignKey(NpcTemplate, on_delete=models.SET_NULL, null=True)
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True)
    level = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.npc_template.name} - {self.skill.name} ({self.level})"


class NpcTemplateResource(models.Model):
    npc_template = models.ForeignKey(NpcTemplate, on_delete=models.SET_NULL, null=True)
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.npc_template.name} - {self.resource.name} ({self.quantity})"


class Npc(models.Model):
    npc_teplate = models.ForeignKey(NpcTemplate, on_delete=models.CASCADE)
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
    is_npc = models.BooleanField(default=False)
    name = models.CharField(max_length=30, null=False, blank=False, default="npc")
    description = models.TextField(max_length=2500, blank=True)
    image = models.CharField(max_length=250, null=True, blank=True, default="img.png")
    faction_xp = models.PositiveIntegerField(null=False, default=0)
    current_ap = models.PositiveIntegerField(default=10)
    max_ap = models.PositiveBigIntegerField(default=10)
    coordinates = models.JSONField()
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sector.name} - {self.name} : {self.coordinates}"


class Module(models.Model):
    MODULE_TYPE_CHOICES = (
        ("NONE", "none"),
        ("WEAPONRY", "weaponry"),
        ("DEFENSE", "defense"),
        ("MOVEMENT", "movement"),
        ("GATHERING", "gathering"),
        ("PROBE", "probe"),
        ("REPAIR", "repair"),
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
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.type}"


class PlayerLog(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    log = models.ForeignKey(Log, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.log}"


class PlayerResource(models.Model):
    source = models.ForeignKey(Player, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.source.name} : {self.resource.name}"


class PlayerRecipe(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.recipe.name}"


class PlayerSkill(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, default=1)
    level = models.PositiveIntegerField(default=0)
    progress = models.FloatField(default=1.0)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.skill.name}, level = {self.level}"


class PlayerResearch(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    research = models.ForeignKey(Research, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.research.name}"


class PlayerPrivateMessage(models.Model):
    player_sender = models.ForeignKey(
        Player, related_name="sender", on_delete=models.CASCADE
    )
    player_receiver = models.ForeignKey(
        Player, related_name="receiver", on_delete=models.CASCADE
    )
    message = models.TextField(max_length=2500, blank=True)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"{self.player_sender.name} to {self.player_receiver.name} : {self.message}"
        )


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
    module_id_list = models.JSONField(null=True)
    current_hp = models.SmallIntegerField(default=100)
    max_hp = models.SmallIntegerField(default=100)
    current_movement = models.PositiveSmallIntegerField(default=10)
    max_movement = models.PositiveSmallIntegerField(default=10)
    current_missile_defense = models.SmallIntegerField(default=0)
    current_thermal_defense = models.SmallIntegerField(default=0)
    current_ballistic_defense = models.SmallIntegerField(default=0)
    current_cargo_size = models.SmallIntegerField(default=2)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_CHOICES[0]
    )
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.ship.name} : {self.player.name}"


class PlayerShipResource(models.Model):
    source = models.ForeignKey(PlayerShip, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, null=True)
    quantity = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.source.name} - {self.resource.name} - quantity : {self.quantity}"


class FactionLeader(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    faction = models.ForeignKey(Faction, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=localtime)
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
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.source.name} : {self.resource.name}, quantity : {self.quantity}"


class FactionRank(models.Model):
    faction = models.ForeignKey(Faction, on_delete=models.CASCADE)
    name = models.CharField(max_length=30, null=False, blank=False, default="Rank1")
    description = models.TextField(max_length=2500, blank=True)
    responsibility_level = models.PositiveSmallIntegerField(default=0)
    faction_xp_required = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=localtime)
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
    created_at = models.DateTimeField("creation date", default=localtime)
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
    created_at = models.DateTimeField("creation date", default=localtime)
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
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.source.name} : {self.resource.name}"
