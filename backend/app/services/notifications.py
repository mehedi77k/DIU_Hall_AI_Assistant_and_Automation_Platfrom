from email.message import EmailMessage
import smtplib

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Notification, User


def send_email(recipient_email: str, title: str, message: str) -> None:
    """
    Send an email via SMTP.

    Email failures are logged only.
    API response will not fail if email sending fails.
    """
    if not settings.email_notifications_enabled:
        return

    if (
        not settings.smtp_host
        or not settings.smtp_port
        or not settings.smtp_username
        or not settings.smtp_password
    ):
        print("Email not sent: SMTP configuration is incomplete.")
        return

    if not recipient_email:
        return

    from_email = settings.smtp_from_email or settings.smtp_username

    email_body = f"""{message}

---
DIU Hall AI Assistant & Automation Platform
"""

    email_message = EmailMessage()
    email_message["Subject"] = title
    email_message["From"] = from_email
    email_message["To"] = recipient_email
    email_message.set_content(email_body)

    try:
        with smtplib.SMTP(
            settings.smtp_host,
            settings.smtp_port,
            timeout=10,
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
    email_subject: str | None = None,
    email_body: str | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
    action_url: str | None = None,
) -> Notification | None:
    """
    Create an in-app notification and optionally schedule an email notification.

    - title/message/category are used for in-app notification.
    - email_subject/email_body can be different and more detailed.
    - entity_type/entity_id/action_url support notification deep links.
    """
    if user is None:
        return None

    notification = Notification(
        recipient_user_id=user.id,
        title=title,
        message=message,
        category=category,
        is_read=False,
        entity_type=entity_type,
        entity_id=entity_id,
        action_url=action_url,
    )

    db.add(notification)

    if background_tasks is not None and settings.email_notifications_enabled:
        if user.email:
            background_tasks.add_task(
                send_email,
                user.email,
                email_subject or title,
                email_body or message,
            )
            print(f"Email notification scheduled for {user.email}")
        else:
            print("Email notification skipped: user has no email address.")

    return notification