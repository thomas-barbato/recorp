from django import template
from django.utils.translation import gettext as _

register = template.Library()


@register.filter
def sub(value, arg):
    try:
        value = int(value)
        arg = int(arg)
        if (value - arg) >= 0:
            return value - arg
        return value
    except:
        pass
    return ""

@register.filter
def from_underscore_to_space(value):
    splitted_value = value.split("_")
    if splitted_value[0] == "DEFENSE":
        return f"{splitted_value[1]} {splitted_value[0]}"
    return value.replace("_"," ")


@register.filter
def module_category_label(value):
    label = from_underscore_to_space(value)
    return _(label)
