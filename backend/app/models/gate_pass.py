from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utc_now() -> datetime:
    """
    Return the current timezone-aware UTC date and time.
    """
    return datetime.now(timezone.utc)


class GatePass(Base):
    __tablename__ = "gate_passes"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    student_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    student_id: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    room_no: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    leave_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    return_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    guardian_phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    reason: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    item_list: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False,
    )

    # Exit tracking field
    # Default: No
    # After Gate Security confirms exit: Yes
    exit: Mapped[str] = mapped_column(
        String(10),
        default="No",
        nullable=False,
    )

    approved_by: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    pdf_path: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # QR and Gate Security verification fields
    verification_id: Mapped[str | None] = mapped_column(
        String(80),
        unique=True,
        nullable=True,
        index=True,
    )

    qr_code_path: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # Time when Gate Security confirmed student exit
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ID of the Gate Security user who confirmed the exit
    used_by_security_id: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    # Gate-pass creation time stored as timezone-aware UTC
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )