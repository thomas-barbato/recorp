from django.contrib.sessions.models import Session

class OneSessionPerUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Vérifier si LoggedInUser existe, sinon le créer
            if not hasattr(request.user, 'logged_in_user'):
                from core.models import LoggedInUser
                LoggedInUser.objects.create(
                    user=request.user,
                    session_key=request.session.session_key
                )
            else:
                stored_session_key = request.user.logged_in_user.session_key
                current_session_key = request.session.session_key

                # Si les clés de session sont différentes
                if stored_session_key and stored_session_key != current_session_key:
                    # Vérifier si la session existe avant de la supprimer
                    try:
                        Session.objects.get(session_key=stored_session_key).delete()
                    except Session.DoesNotExist:
                        # La session a déjà été supprimée ou a expiré
                        pass

                # Mettre à jour avec la nouvelle clé de session
                request.user.logged_in_user.session_key = current_session_key
                request.user.logged_in_user.save()

        response = self.get_response(request)
        return response
    
    
class WebSocketSessionMiddleware:
    """Middleware pour maintenir les sessions WebSocket actives."""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Maintenir la session active pour les requÃªtes WebSocket
        if hasattr(request, 'session') and request.session.session_key:
            request.session.save()
            
        return response