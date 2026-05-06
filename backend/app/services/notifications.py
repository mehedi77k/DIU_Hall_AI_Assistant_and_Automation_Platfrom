from email.message import EmailMessage
import smtplib

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Notification, User


def send_email(recipient_email: str, title: str, message: str) -> None:
    """
    Send an email via SMTP. Validates SMTP configuration and handles errors gracefully.
    Email failures do not raise exceptions to prevent API disruption.
    """
    if not settings.email_notifications_enabled:
        return

    # Validate all required SMTP settings
    if (
        not settings.smtp_host
        or not settings.smtp_port
        or not settings.smtp_username
        or not settings.smtp_password
        or not settings.smtp_from_email
    ):
        print("Email not sent: SMTP configuration is incomplete.")
        return

    if not recipient_email:
        return

    # Add footer to email message
    email_body = f"{message}\n\n---\nDIU Hall AI Assistant & Automation Platform"

    email_message = EmailMessage()
    email_message["Subject"] = title
    email_message["From"] = settings.smtp_from_email
    email_message["To"] = recipient_email
    email_message.set_content(email_body)

    try:
        with smtplib.SMTP(
            settings.smtp_host, settings.smtp_port, timeout=10
        ) as smtp_client:
            if settings.smtp_use_tls:
                smtp_client.starttls()

            smtp_client.login(settings.smtp_username, settings.smtp_password)
            smtp_client.send_message(email_message)
            print(f"Email sent successfully to {recipient_email}")

    except Exception as exc:
        print(f"Email sending failed for {recipient_email}: {exc}")


def notify_user(
    db: Session,
    background_tasks: BackgroundTasks | None,
    user: User | None,
    title: str,
    message: str,
    category: str,
) -> Notification | None:
    """
    Create an in-app notification and optionally schedule an email notification.
    Always creates the in-app notification, but only schedules email if enabled and user has email.
    """
    if user is None:
        return None

    notification = Notification(
        recipient_user_id=user.id,
        title=title,
        message=message,
        category=category,
        is_read=False,
    )

    db.add(notification)

    if background_tasks is not None and settings.email_notifications_enabled:
        if user.email:
            background_tasks.add_task(send_email, user.email, title, message)
            print(f"Email notification scheduled for {user.email}")
        else:
            print("Email notification skipped: user has no email address.")

    return notification