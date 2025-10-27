from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
import os

class Command(BaseCommand):
    help = 'Reset complet : DROP DATABASE + recréation'

    def handle(self, *args, **options):
        # Confirmation
        confirm = input("⚠️  SUPPRIMER TOUTE LA BASE ? Tapez 'SUPPRIMER': ")
        if confirm != 'SUPPRIMER':
            self.stdout.write(self.style.WARNING('❌ Annulé'))
            return

        db_name = connection.settings_dict['NAME']
        db_user = connection.settings_dict['USER']
        db_password = connection.settings_dict['PASSWORD']
        db_host = connection.settings_dict['HOST']

        self.stdout.write(self.style.WARNING(f'🔴 Suppression de {db_name}...'))

        # Fermer la connexion Django
        connection.close()

        # Commandes SQL
        import subprocess
        sql = f"""
        DROP DATABASE IF EXISTS {db_name};
        CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        """
        
        process = subprocess.run(
            ['mysql', '-u', db_user, f'-p{db_password}', '-h', db_host],
            input=sql.encode(),
            capture_output=True
        )

        if process.returncode != 0:
            self.stdout.write(self.style.ERROR(f'❌ Erreur MySQL: {process.stderr.decode()}'))
            return

        self.stdout.write(self.style.SUCCESS('✅ Base recréée'))

        # Supprimer migrations
        apps = ['recorp', 'core']  # VOS APPS
        for app in apps:
            migrations_dir = f'{app}/migrations'
            if os.path.exists(migrations_dir):
                for file in os.listdir(migrations_dir):
                    if file.endswith('.py') and file != '__init__.py':
                        os.remove(os.path.join(migrations_dir, file))
                self.stdout.write(self.style.SUCCESS(f'✅ Migrations {app} supprimées'))

        # Recréer
        self.stdout.write(self.style.WARNING('🔄 Recréation des migrations...'))
        call_command('makemigrations')
        
        self.stdout.write(self.style.WARNING('🔄 Application des migrations...'))
        call_command('migrate')

        self.stdout.write(self.style.SUCCESS('✅ TERMINÉ !'))
        self.stdout.write(self.style.WARNING('⚠️  Créez un superuser : python manage.py createsuperuser'))