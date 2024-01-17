from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

localtime = timezone.now


class User(AbstractBaseUser):
    date_joined = models.DateTimeField(default=localtime)
    username = models.CharField(default="user_default", unique=True, blank=False)

    def __str__(self):
        return f"{ self.username } - email: { self.email }, date_joined: { self.date_joined }"


class CashShop(models.Model):
    pass


class UserPurchase(models.Model):
    pass


class Resource(models.Model):
    RARITY_CHOICES = (
        ("COMMON", "commune"),
        ("UNUSUAL", "peu commune"),
        ("RARE", "rare"),
        ("VERY_RARE", "tres rare"),
    )
    name = models.CharField(max_length=30, null=False, blank=False, default="Resource")
    image = models.ImageField(upload_to="resource/", null=True, blank=True)
    description = models.TextField(max_length=2500, blank=True)
    rarity = models.CharField(
        max_length=10, choices=RARITY_CHOICES, default=RARITY_CHOICES[0]
    )
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Planet(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Planet")
    image = models.ImageField(upload_to="planet/", null=True, blank=True)
    description = models.TextField(max_length=2500, blank=True)
    coordinates = models.JSONField()
    created_at = models.DateTimeField(default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Station(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Station")
    image = models.ImageField(upload_to="station/", null=True, blank=True)
    description = models.TextField(max_length=2500, blank=True)
    coordinates = models.JSONField()
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Asteroid(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Asteroid")
    image = models.ImageField(upload_to="asteroid/", null=True, blank=True)
    description = models.TextField(max_length=2500, blank=True)
    coordinates = models.JSONField()
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Faction(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Faction")
    image = models.ImageField(upload_to="faction/", null=True, blank=True)
    description = models.TextField(max_length=2500, blank=True)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Player(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    faction = models.ForeignKey(Faction, on_delete=models.CASCADE)
    is_npc = models.BooleanField(default=False)
    name = models.CharField(max_length=30, null=False, blank=False, default="Faction")
    description = models.TextField(max_length=2500, blank=True)
    image = models.ImageField(upload_to="player_and_npc/", null=True, blank=True)
    faction_xp = models.PositiveIntegerField(null=False, default=0)
    time_to_play = models.PositiveIntegerField(default=(60 * 60) * 24)
    coordinates = models.JSONField()
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


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
        ('ROOKIE', 'Rookie'),
        ('QUALIFIED', 'Qualified'),
        ('PROFESSIONAL', 'Professional'),
        ('EXPERT', 'Expert'),
        ('GREAT_EXPERT', 'Great expert'),
        ('MASTER', 'Master'),
        ('GRAND_MASTER', 'Grand master')
    )

    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    min_level_range = models.PositiveIntegerField(default=0)
    max_level_range = models.PositiveIntegerField(default=1)
    effect = models.JSONField()
    expertise = models.CharField(choices=EXPERTISE_CHOICE, default=EXPERTISE_CHOICE[0])
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.skill.name} [{self.min_level_range} - {self.max_level_range}] expertise = {self.expertise}"


class Recipe(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Recipe1")
    description = models.TextField(max_length=2500, blank=True)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    value_needed = models.FloatField(default=1.0, null=False, blank=False)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Research(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False, default="Recipe1")
    description = models.TextField(max_length=2500, blank=True)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    image = models.ImageField(upload_to="research/", null=True, blank=True)
    time_to_complete = models.PositiveIntegerField(default=(60 * 60) * 24)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Log(models.Model):
    LOG_TYPE_CHOICES = (
        ("ATTACK", "attack"),
        ("DEFENSE", "defense"),
        ("ZONE_CHANGE", "zone_change"),
        ("DEATH", "death"),
        ("KILL", "kill"),
        ("CRAFT_END", "craft_end"),
        ("RESEARCH_END", "research_end"),
        ("LEVEL_UP", "level_up"),
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
    max_speed = models.FloatField(default=1.0)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class Ship(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False)
    description = models.TextField(max_length=2500, blank=True)
    image = models.ImageField(upload_to="ship/", null=True, blank=True)
    module_slot_available = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class ModuleEffect(models.Model):
    name = models.CharField(max_length=30, null=False, blank=False)
    description = models.TextField(max_length=2500, blank=True)
    effect = models.JSONField()
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.effect}"


class Module(models.Model):
    name = models.CharField(
        max_length=30, null=False, blank=False, default="Light Cruiser"
    )
    description = models.TextField(max_length=2500, blank=True)
    module_effect = models.ForeignKey(ModuleEffect, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"


class PlayerLog(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    log = models.ForeignKey(Log, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.log.content}"


class PlayerResource(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.resource.name}"


class PlayerRecipe(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.recipe.name}"


class PlayerSkillEffect(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    skill_effect = models.ForeignKey(SkillEffect, on_delete=models.CASCADE)
    level = models.PositiveIntegerField(default=0)
    progress = models.FloatField(default=1.0)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player.name} : {self.skill_effect.skill.name}, level = {self.level}"


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
        return f"{self.player_sender.name} to {self.player_receiver.name} : {self.message}"


class PlayerShip(models.Model):
    STATUS_CHOICES = (("FULL", "pleine forme"), ("WOUNDED", "blesse"), ("DEAD", "mort"))

    ship = models.ForeignKey(Ship, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    current_hp = models.IntegerField()
    max_hp = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_CHOICES[0]
    )
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.ship.name} : {self.player.name}"


class PlayerShipModule(models.Model):
    player_ship = models.ForeignKey(PlayerShip, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)


class PlayerShipResource(models.Model):
    player_ship = models.ForeignKey(PlayerShip, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)


class FactionLeader(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    faction = models.ForeignKey(Faction, on_delete=models.CASCADE)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.faction.name} : {self.player.name}"


class FactionResource(models.Model):
    faction = models.ForeignKey(Faction, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.faction.name} : {self.resource.name}, quantity : {self.quantity}"


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
    planet = models.ForeignKey(Planet, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    max_quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.planet.name} : {self.resource.name}, max_quantity: {self.max_quantity}"


class AsteroidResource(models.Model):
    asteroid = models.ForeignKey(Asteroid, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    max_quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.asteroid.name} : {self.resource.name}, quantity: {self.quantity} / {self.max_quantity}"


class StationResource(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.station.name} : {self.resource.name}, quantity : {self.quantity}"


class Sector(models.Model):
    SECURITY_LEVEL_CHOICES = (
        ("NULL", "aucune"),
        ("LOW", "faible securite"),
        ("MEDIUM", "securite moyenne"),
        ("HIGHT", "haute securite"),
    )

    faction = models.ForeignKey(Faction, on_delete=models.CASCADE)
    name = models.CharField(max_length=30, null=False, blank=False, default="Sector")
    image = models.ImageField(upload_to="sector/", null=True, blank=True)
    description = models.TextField(max_length=2500, blank=True)
    security_level = models.CharField(
        max_length=20, choices=SECURITY_LEVEL_CHOICES, default=SECURITY_LEVEL_CHOICES[0]
    )
    is_faction_level_starter = models.BooleanField(default=False)
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sector.name} : {self.faction.name}, is_faction_level_starter : {self.is_faction_level_starter}"


class SectorContent(models.Model):
    CONTENT_TYPE_CHOICES = (
        ("PLANET", "planet"),
        ("ASTEROID", "asteroid"),
        ("FACTION", "faction"),
        ("STATION", "station"),
        ("PLAYER", "player"),
        ("NPC", "npc"),
    )

    sector = models.ForeignKey(Faction, on_delete=models.CASCADE)
    content = models.PositiveIntegerField(default=1, null=False, blank=False)
    content_type = models.CharField(
        max_length=20, choices=CONTENT_TYPE_CHOICES, default=CONTENT_TYPE_CHOICES[0]
    )
    created_at = models.DateTimeField("creation date", default=localtime)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sector.name} : {self.content_type}"
