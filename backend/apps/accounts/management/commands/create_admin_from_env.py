import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Idempotently creates or updates an admin superuser from ADMIN_EMAIL and ADMIN_PASSWORD environment variables."

    def handle(self, *args, **options):
        raw_email = os.environ.get("ADMIN_EMAIL", "")
        raw_password = os.environ.get("ADMIN_PASSWORD", "")

        email = raw_email.strip()
        password = raw_password.strip()

        has_email = bool(email)
        has_password = bool(password)

        self.stdout.write(self.style.MIGRATE_HEADING("[create_admin_from_env] Checking environment configuration..."))
        self.stdout.write(f"ADMIN_EMAIL configured: {has_email}")
        self.stdout.write(f"ADMIN_PASSWORD configured: {has_password}")

        if not has_email or not has_password:
            self.stdout.write(
                self.style.WARNING(
                    "[create_admin_from_env] ADMIN_EMAIL or ADMIN_PASSWORD not configured. Skipping superuser creation."
                )
            )
            return

        User = get_user_model()
        user = User.objects.filter(email=email).first()

        if user:
            updated = False
            if not user.is_staff:
                user.is_staff = True
                updated = True
            if not user.is_superuser:
                user.is_superuser = True
                updated = True
            if not user.is_active:
                user.is_active = True
                updated = True

            if updated:
                user.save(update_fields=["is_staff", "is_superuser", "is_active"])
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[create_admin_from_env] Existing user '{email}' updated with superuser privileges."
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[create_admin_from_env] Superuser '{email}' already exists with active admin privileges."
                    )
                )
        else:
            User.objects.create_superuser(email=email, password=password)
            self.stdout.write(
                self.style.SUCCESS(
                    f"[create_admin_from_env] Superuser '{email}' successfully created from environment variables."
                )
            )

