from django.conf import settings
from django.contrib.sessions.models import Session
from django.http import HttpResponseRedirect
from django.shortcuts import resolve_url


class OneSessionPerUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            if not hasattr(request.user, "logged_in_user"):
                from core.models import LoggedInUser

                LoggedInUser.objects.create(
                    user=request.user,
                    session_key=request.session.session_key,
                )
            else:
                stored_session_key = request.user.logged_in_user.session_key
                current_session_key = request.session.session_key

                if stored_session_key and stored_session_key != current_session_key:
                    try:
                        Session.objects.get(session_key=stored_session_key).delete()
                    except Session.DoesNotExist:
                        pass

                request.user.logged_in_user.session_key = current_session_key
                request.user.logged_in_user.save()

        response = self.get_response(request)
        return response


class WebSocketSessionMiddleware:
    """Keeps websocket-backed sessions active."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if hasattr(request, "session") and request.session.session_key:
            request.session.save()

        return response


class Redirect404ToIndexMiddleware:
    """
    Redirect browser HTML 404 responses to index.
    Prevents technical Django DEBUG 404 pages from being exposed to end users.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if response.status_code != 404:
            return response
        if request.method != "GET":
            return response

        accept = (request.headers.get("Accept") or "").lower()
        if "text/html" not in accept:
            return response

        path = request.path or "/"
        static_url = str(getattr(settings, "STATIC_URL", "") or "")
        media_url = str(getattr(settings, "MEDIA_URL", "") or "")
        if (static_url and path.startswith(static_url)) or (media_url and path.startswith(media_url)):
            return response

        target = resolve_url("core:index_view")
        if path == target:
            return response
        return HttpResponseRedirect(target)
