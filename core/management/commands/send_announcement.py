from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.backend.player_actions import send_admin_announcement

class Command(BaseCommand):
    help = 'Envoie une annonce à tous les joueurs'

    def add_arguments(self, parser):
        parser.add_argument('subject', type=str, help='Sujet du message')
        parser.add_argument('body', type=str, help='Corps du message')
        parser.add_argument(
            '--priority',
            type=str,
            default='HIGH',
            choices=['HIGH', 'URGENT'],
            help='Priorité du message'
        )
        parser.add_argument(
            '--admin-username',
            type=str,
            default='admin',
            help='Username de l\'admin qui envoie'
        )

    def handle(self, *args, **options):
        subject = options['subject']
        body = options['body']
        priority = options['priority']
        admin_username = options['admin_username']
        
        try:
            admin_user = User.objects.get(username=admin_username, is_staff=True)
            
            message = send_admin_announcement(
                admin_user_id=admin_user.id,
                subject=subject,
                body=body,
                priority=priority
            )
            
            recipient_count = message.received_messages.count()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Annonce "{subject}" envoyée à {recipient_count} joueurs'
                )
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'✗ Admin "{admin_username}" introuvable')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erreur: {e}')
            )