from django import template

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
