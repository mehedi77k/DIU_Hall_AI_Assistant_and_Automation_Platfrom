import json
import shutil
import textwrap
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, require_admin
from app.core.security import create_access_token, hash_password, verify_password
from app.db.base import Base
from app.db.session import engine, get_db
from app.db.seed_hall_rules import seed_hall_rules_from_json
from app.models import (
    ChatMessage,
    ChatSession,
    Complaint,
    GatePass,
    HallRule,
    Notice,
    Notification,
    User,
)
from app.schemas.common import (
    ChatMessageResponse,
    ChatRenameRequest,
    ChatResponse,
    ChatSendRequest,
    ChatSessionCreate,
    ChatSessionResponse,
    ComplaintCreate,
    ComplaintResponse,
    ComplaintStatusUpdate,
    GatePassCreate,
    GatePassResponse,
    HallRuleCreate,
    HallRuleResponse,
    HallRuleUpdate,
    NoticeCreate,
    NoticeResponse,
    NotificationResponse,
    TestEmailRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.notifications import notify_user, send_email
from app.services.rag.answering import answer_question
from app.services.rag.indexer import (
    delete_rule_from_vector_db,
    rebuild_vector_db,
    upsert_rule_to_vector_db,
)

BASE_DIR = Path("/app")
UPLOADS_DIR = BASE_DIR / "uploads"
STUDENT_SIGNATURE_DIR = UPLOADS_DIR / "signatures" / "students"
GATE_PASS_PDF_DIR = UPLOADS_DIR / "gate_pass_pdfs"

ASSET_SIGNATURE_DIR = BASE_DIR / "assets" / "signatures"
CHECKER_SIGNATURE_PATH = ASSET_SIGNATURE_DIR / "checker_signature.png"


def ensure_directories():
    STUDENT_SIGNATURE_DIR.mkdir(parents=True, exist_ok=True)
    GATE_PASS_PDF_DIR.mkdir(parents=True, exist_ok=True)
    ASSET_SIGNATURE_DIR.mkdir(parents=True, exist_ok=True)


def public_path_to_file(public_path: str | None) -> Path | None:
    if not public_path:
        return None
    return BASE_DIR / public_path.lstrip("/")


def get_user_signature_file(user: User) -> Path | None:
    return public_path_to_file(user.signature_image_path)


def require_user_signature(user: User, message: str):
    signature_file = get_user_signature_file(user)

    if not user.signature_image_path or not signature_file or not signature_file.exists():
        raise HTTPException(
            status_code=400,
            detail=message,
        )


def wrap_lines(text: str, width: int = 80) -> list[str]:
    if not text:
        return ["-"]

    lines = textwrap.wrap(text, width=width)
    return lines if lines else ["-"]


def build_chat_title(text: str) -> str:
    title = text.strip()
    if not title:
        return "New chat"
    return title[:46] + "..." if len(title) > 46 else title


def parse_matched_rules(raw_value: str | None) -> list[dict]:
    if not raw_value:
        return []

    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def build_frontend_url(path: str) -> str:
    base_url = settings.public_frontend_url.rstrip("/")
    clean_path = path if path.startswith("/") else f"/{path}"
    return f"{base_url}{clean_path}"


def build_backend_url(path: str) -> str:
    base_url = settings.public_backend_url.rstrip("/")
    clean_path = path if path.startswith("/") else f"/{path}"
    return f"{base_url}{clean_path}"


def build_gate_pass_approved_email(
    student: User,
    gate_pass: GatePass,
    approved_admin: User,
) -> str:
    gate_pass_page_url = build_frontend_url("/gate-pass")
    pdf_url = (
        build_backend_url(gate_pass.pdf_path)
        if gate_pass.pdf_path
        else gate_pass_page_url
    )

    return f"""
Dear {student.full_name},

Your gate pass request has been approved.

Gate Pass ID: GP-{gate_pass.id:04d}
Student ID: {gate_pass.student_id}
Room No: {gate_pass.room_no}
Leave Date: {gate_pass.leave_date}
Return Date: {gate_pass.return_date}
Approved By: {approved_admin.full_name}
Approved At: {datetime.now().strftime("%Y-%m-%d %H:%M")}

Download Gate Pass PDF:
{pdf_url}

You can also view your gate pass from the DIU Hall AI platform:
{gate_pass_page_url}

Regards,
DIU Hall Administration
""".strip()


def build_gate_pass_rejected_email(
    student: User,
    gate_pass: GatePass,
) -> str:
    gate_pass_page_url = build_frontend_url("/gate-pass")

    return f"""
Dear {student.full_name},

Your gate pass request has been rejected.

Gate Pass ID: GP-{gate_pass.id:04d}
Student ID: {gate_pass.student_id}
Room No: {gate_pass.room_no}
Leave Date: {gate_pass.leave_date}
Return Date: {gate_pass.return_date}

Please check the DIU Hall AI platform or contact hall administration for more information.

View Gate Pass Requests:
{gate_pass_page_url}

Regards,
DIU Hall Administration
""".strip()


def build_notice_email(student: User, notice: Notice) -> str:
    return f"""
Dear {student.full_name},

A new hall notice has been posted.

Title: {notice.title}

{notice.content}

View Notice Board:
{build_frontend_url("/notices")}

Regards,
DIU Hall Administration
""".strip()


def build_complaint_status_email(
    student: User,
    complaint: Complaint,
    status: str,
) -> str:
    return f"""
Dear {student.full_name},

Your complaint status has been updated.

Complaint ID: #{complaint.id}
Category: {complaint.category}
Room No: {complaint.room_no}
Status: {status}

View Complaints:
{build_frontend_url("/complaints")}

Regards,
DIU Hall Administration
""".strip()


def draw_signature_box(
    pdf: canvas.Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    label: str,
    image_path: Path | None,
    fallback_text: str,
):
    pdf.setStrokeColor(colors.HexColor("#1f2937"))
    pdf.rect(x, y, w, h, stroke=1, fill=0)

    if image_path and image_path.exists():
        try:
            pdf.drawImage(
                str(image_path),
                x + 4,
                y + 8,
                width=w - 8,
                height=h - 20,
                preserveAspectRatio=True,
                mask="auto",
            )
        except Exception:
            pdf.setFont("Times-Roman", 9)
            pdf.drawCentredString(x + (w / 2), y + (h / 2), fallback_text)
    else:
        pdf.setFont("Times-Roman", 9)
        pdf.drawCentredString(x + (w / 2), y + (h / 2), fallback_text)

    pdf.setFont("Times-Bold", 10)
    pdf.drawString(x, y - 14, label)


def generate_gate_pass_pdf(
    gate_pass: GatePass,
    student: User,
    approved_admin: User,
) -> str:
    ensure_directories()

    filename = f"gate_pass_{gate_pass.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    pdf_file_path = GATE_PASS_PDF_DIR / filename

    pdf = canvas.Canvas(str(pdf_file_path), pagesize=A4)
    page_width, page_height = A4

    margin_x = 18 * mm
    top_y = page_height - (18 * mm)
    content_width = page_width - (2 * margin_x)

    pdf.setTitle(f"Gate Pass {gate_pass.id}")

    pdf.setLineWidth(1)
    pdf.setStrokeColor(colors.HexColor("#0f5132"))
    pdf.rect(
        margin_x,
        18 * mm,
        content_width,
        page_height - (36 * mm),
        stroke=1,
        fill=0,
    )

    pdf.setFillColor(colors.HexColor("#0f5132"))
    pdf.setFont("Times-Bold", 20)
    title_y = top_y + (6 * mm)
    pdf.drawCentredString(
        margin_x + (content_width / 2),
        title_y,
        "DIU HALL Gate Pass",
    )

    pdf.setFillColor(colors.black)
    pdf.setFont("Times-Roman", 11)

    header_box_top = top_y - 24
    subtitle_y = header_box_top - 14
    approved_y = subtitle_y - 14
    header_box_bottom = approved_y - 8
    header_box_height = header_box_top - header_box_bottom

    pdf.setLineWidth(0.8)
    pdf.setStrokeColor(colors.HexColor("#0f5132"))
    pdf.rect(
        margin_x + 6,
        header_box_bottom,
        content_width - 12,
        header_box_height,
        stroke=1,
        fill=0,
    )

    pdf.drawString(
        margin_x + 12,
        subtitle_y,
        "DIU Hall AI Assistant and Automation Platform",
    )
    pdf.drawRightString(
        page_width - margin_x - 12,
        subtitle_y,
        f"Gate Pass No: GP-{gate_pass.id:04d}",
    )
    pdf.drawRightString(
        page_width - margin_x - 12,
        approved_y,
        f"Approved Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
    )

    y = header_box_bottom - 16

    pdf.setLineWidth(0.5)
    pdf.line(margin_x + 8, y, page_width - margin_x - 8, y)
    y -= 18

    pdf.setFont("Times-Bold", 14)
    pdf.drawString(margin_x + 8, y, "Student Information")
    y -= 18

    fields = [
        ("Student Name: ", gate_pass.student_name),
        ("Student ID: ", gate_pass.student_id),
        ("Room No: ", gate_pass.room_no),
        ("Guardian Phone: ", gate_pass.guardian_phone),
        ("Leave Date: ", str(gate_pass.leave_date)),
        ("Return Date: ", str(gate_pass.return_date)),
    ]

    for label, value in fields:
        pdf.setFont("Times-Bold", 12)
        pdf.drawString(margin_x + 8, y, label)
        label_width = pdf.stringWidth(label, "Times-Bold", 12)
        pdf.setFont("Times-Roman", 12)
        pdf.drawString(margin_x + 8 + label_width, y, value)
        y -= 16

    y -= 6

    pdf.setFont("Times-Bold", 14)
    pdf.drawString(margin_x + 8, y, "Reason")
    y -= 18

    pdf.setFont("Times-Roman", 12)
    for line in wrap_lines(gate_pass.reason, width=90):
        pdf.drawString(margin_x + 8, y, line)
        y -= 15

    y -= 8

    pdf.setFont("Times-Bold", 14)
    pdf.drawString(margin_x + 8, y, "Items / Details")
    y -= 18

    pdf.setFont("Times-Roman", 12)
    for line in wrap_lines(gate_pass.item_list, width=90):
        pdf.drawString(margin_x + 8, y, line)
        y -= 15

    y -= 15

    pdf.setFont("Times-Bold", 14)
    pdf.drawString(margin_x + 8, y, "Approval Information")
    y -= 18

    approval_fields = [
        ("Status: ", gate_pass.status.upper()),
        ("Approved By: ", approved_admin.full_name),
    ]

    for label, value in approval_fields:
        pdf.setFont("Times-Bold", 12)
        pdf.drawString(margin_x + 8, y, label)
        label_width = pdf.stringWidth(label, "Times-Bold", 12)
        pdf.setFont("Times-Roman", 12)
        pdf.drawString(margin_x + 8 + label_width, y, value)
        y -= 16

    student_signature_file = public_path_to_file(student.signature_image_path)
    admin_signature_file = public_path_to_file(approved_admin.signature_image_path)

    gap = 6 * mm
    box_height = 22 * mm
    available_width = content_width - 16
    box_width = (available_width - (2 * gap)) / 3
    box_top_padding = 6 * mm

    y -= box_height + box_top_padding

    first_x = margin_x + 8
    second_x = first_x + box_width + gap
    third_x = second_x + box_width + gap

    draw_signature_box(
        pdf,
        first_x,
        y,
        box_width,
        box_height,
        "Student Signature",
        student_signature_file,
        "No signature",
    )

    draw_signature_box(
        pdf,
        second_x,
        y,
        box_width,
        box_height,
        "Approved By",
        admin_signature_file,
        "Admin signature not uploaded",
    )

    draw_signature_box(
        pdf,
        third_x,
        y,
        box_width,
        box_height,
        "Checked By",
        CHECKER_SIGNATURE_PATH,
        "Checker signature",
    )

    pdf.setFont("Times-Roman", 9)
    pdf.drawString(
        margin_x + 8,
        25 * mm,
        "System note: Keep this gate pass with you until hall re-entry / checking is complete.",
    )

    pdf.save()

    return f"/uploads/gate_pass_pdfs/{filename}"


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_directories()
    Base.metadata.create_all(bind=engine)
    seed_hall_rules_from_json()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOADS_DIR), check_dir=False),
    name="uploads",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "DIU Hall AI Backend is running",
        "health": "/api/v1/health",
        "docs": "/docs",
        "frontend": settings.public_frontend_url,
    }


@app.get("/api/v1/health")
def health_check():
    return {
        "message": "Backend is running",
        "app_name": settings.app_name,
        "environment": settings.app_env,
    }


@app.post("/api/v1/auth/register", response_model=UserResponse)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_student = db.query(User).filter(User.student_id == payload.student_id).first()
    if existing_student:
        raise HTTPException(status_code=400, detail="Student/Admin ID already registered")

    user = User(
        full_name=payload.full_name,
        student_id=payload.student_id,
        email=payload.email,
        phone=payload.phone,
        role=payload.role,
        password_hash=hash_password(payload.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user,
    )


@app.get("/api/v1/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/api/v1/users/me/signature", response_model=UserResponse)
def upload_my_signature(
    signature: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not signature.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    extension = Path(signature.filename).suffix.lower()
    if extension not in [".png", ".jpg", ".jpeg"]:
        raise HTTPException(
            status_code=400,
            detail="Only PNG, JPG, and JPEG files are allowed",
        )

    ensure_directories()

    if current_user.signature_image_path:
        old_file = public_path_to_file(current_user.signature_image_path)
        if old_file and old_file.exists():
            old_file.unlink(missing_ok=True)

    filename = f"user_{current_user.id}_{uuid4().hex}{extension}"
    saved_path = STUDENT_SIGNATURE_DIR / filename

    with saved_path.open("wb") as buffer:
        shutil.copyfileobj(signature.file, buffer)

    current_user.signature_image_path = f"/uploads/signatures/students/{filename}"

    db.commit()
    db.refresh(current_user)

    return current_user


@app.get("/api/v1/gate-passes", response_model=list[GatePassResponse])
def list_gate_passes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        return db.query(GatePass).order_by(GatePass.id.desc()).all()

    return (
        db.query(GatePass)
        .filter(GatePass.student_id == current_user.student_id)
        .order_by(GatePass.id.desc())
        .all()
    )


@app.post("/api/v1/gate-passes", response_model=GatePassResponse)
def create_gate_pass(
    payload: GatePassCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can submit gate pass requests",
        )

    require_user_signature(
        current_user,
        "Please upload your signature before submitting a gate pass request.",
    )

    gate_pass = GatePass(
        student_name=current_user.full_name,
        student_id=current_user.student_id,
        room_no=payload.room_no,
        leave_date=payload.leave_date,
        return_date=payload.return_date,
        guardian_phone=payload.guardian_phone,
        reason=payload.reason,
        item_list=payload.item_list,
        status="pending",
    )

    db.add(gate_pass)
    db.commit()
    db.refresh(gate_pass)

    return gate_pass


@app.post("/api/v1/gate-passes/{gate_pass_id}/approve", response_model=GatePassResponse)
def approve_gate_pass(
    gate_pass_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    gate_pass = db.query(GatePass).filter(GatePass.id == gate_pass_id).first()
    if not gate_pass:
        raise HTTPException(status_code=404, detail="Gate pass not found")

    student = db.query(User).filter(User.student_id == gate_pass.student_id).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student account not found for this gate pass",
        )

    require_user_signature(
        student,
        "Student signature not uploaded yet",
    )

    require_user_signature(
        current_user,
        "Admin signature not uploaded yet. Please upload your signature before approving gate passes.",
    )

    gate_pass.status = "approved"
    gate_pass.approved_by = current_user.full_name
    gate_pass.pdf_path = generate_gate_pass_pdf(
        gate_pass,
        student,
        current_user,
    )

    notify_user(
        db=db,
        background_tasks=background_tasks,
        user=student,
        title="Gate pass approved",
        message=f"Gate pass GP-{gate_pass.id:04d} has been approved.",
        category="gate_pass",
        email_subject=f"Gate Pass Approved - GP-{gate_pass.id:04d}",
        email_body=build_gate_pass_approved_email(
            student=student,
            gate_pass=gate_pass,
            approved_admin=current_user,
        ),
        entity_type="gate_pass",
        entity_id=gate_pass.id,
        action_url="/gate-pass",
    )

    db.commit()
    db.refresh(gate_pass)

    return gate_pass


@app.post("/api/v1/gate-passes/{gate_pass_id}/reject", response_model=GatePassResponse)
def reject_gate_pass(
    gate_pass_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    require_user_signature(
        current_user,
        "Admin signature not uploaded yet. Please upload your signature before rejecting gate passes.",
    )

    gate_pass = db.query(GatePass).filter(GatePass.id == gate_pass_id).first()
    if not gate_pass:
        raise HTTPException(status_code=404, detail="Gate pass not found")

    student = db.query(User).filter(User.student_id == gate_pass.student_id).first()

    gate_pass.status = "rejected"
    gate_pass.approved_by = None
    gate_pass.pdf_path = None

    if student:
        notify_user(
            db=db,
            background_tasks=background_tasks,
            user=student,
            title="Gate pass rejected",
            message=f"Gate pass GP-{gate_pass.id:04d} has been rejected.",
            category="gate_pass",
            email_subject=f"Gate Pass Rejected - GP-{gate_pass.id:04d}",
            email_body=build_gate_pass_rejected_email(
                student=student,
                gate_pass=gate_pass,
            ),
            entity_type="gate_pass",
            entity_id=gate_pass.id,
            action_url="/gate-pass",
        )

    db.commit()
    db.refresh(gate_pass)

    return gate_pass


@app.get("/api/v1/notices", response_model=list[NoticeResponse])
def list_notices(db: Session = Depends(get_db)):
    return db.query(Notice).order_by(Notice.id.desc()).all()


@app.post("/api/v1/notices", response_model=NoticeResponse)
def create_notice(
    payload: NoticeCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    notice = Notice(
        title=payload.title,
        content=payload.content,
        deadline=payload.deadline,
        posted_by=current_user.full_name,
        created_at=datetime.combine(payload.publish_date, datetime.min.time()),
    )

    db.add(notice)
    db.flush()

    students = (
        db.query(User)
        .filter(User.role == "student")
        .filter(User.is_active.is_(True))
        .all()
    )

    for student in students:
        notify_user(
            db=db,
            background_tasks=background_tasks,
            user=student,
            title="New notice posted",
            message=f"New notice: {notice.title}",
            category="notice",
            email_subject=f"New Hall Notice - {notice.title}",
            email_body=build_notice_email(student, notice),
            entity_type="notice",
            entity_id=notice.id,
            action_url="/notices",
        )

    db.commit()
    db.refresh(notice)

    return notice


@app.get("/api/v1/notifications", response_model=list[NotificationResponse])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Notification)
        .filter(Notification.recipient_user_id == current_user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .all()
    )


@app.post("/api/v1/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .filter(Notification.recipient_user_id == current_user.id)
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return notification


@app.post("/api/v1/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    (
        db.query(Notification)
        .filter(Notification.recipient_user_id == current_user.id)
        .filter(Notification.is_read.is_(False))
        .update({Notification.is_read: True}, synchronize_session=False)
    )
    db.commit()

    return {"message": "All notifications marked as read."}


@app.get("/api/v1/complaints", response_model=list[ComplaintResponse])
def list_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        return db.query(Complaint).order_by(Complaint.id.desc()).all()

    return (
        db.query(Complaint)
        .filter(Complaint.student_id == current_user.student_id)
        .order_by(Complaint.id.desc())
        .all()
    )


@app.post("/api/v1/complaints", response_model=ComplaintResponse)
def create_complaint(
    payload: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can submit complaints",
        )

    complaint = Complaint(
        student_name=current_user.full_name,
        student_id=current_user.student_id,
        room_no=payload.room_no,
        category=payload.category,
        description=payload.description,
        status="submitted",
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return complaint


@app.post("/api/v1/complaints/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintStatusUpdate,
    background_tasks: BackgroundTasks,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = payload.status

    student = db.query(User).filter(User.student_id == complaint.student_id).first()

    if student:
        notify_user(
            db=db,
            background_tasks=background_tasks,
            user=student,
            title="Complaint status updated",
            message=f"Complaint #{complaint.id} status changed to {payload.status}.",
            category="complaint",
            email_subject=f"Complaint Status Updated - #{complaint.id}",
            email_body=build_complaint_status_email(
                student=student,
                complaint=complaint,
                status=payload.status,
            ),
            entity_type="complaint",
            entity_id=complaint.id,
            action_url="/complaints",
        )

    db.commit()
    db.refresh(complaint)

    return complaint


@app.post("/api/v1/dev/test-email")
def test_email(
    payload: TestEmailRequest,
    background_tasks: BackgroundTasks,
    _: User = Depends(require_admin),
):
    if settings.app_env == "production":
        raise HTTPException(
            status_code=403,
            detail="Email testing is disabled in production.",
        )

    test_subject = "DIU Hall AI email test"
    test_body = (
        "This is a test email from DIU Hall AI Assistant. "
        "If you received this, SMTP email notifications are working."
    )

    background_tasks.add_task(send_email, payload.to_email, test_subject, test_body)

    return {"message": "Test email scheduled"}


@app.get("/api/v1/admin/rules", response_model=list[HallRuleResponse])
def list_hall_rules(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(HallRule)
        .filter(HallRule.is_active.is_(True))
        .order_by(HallRule.rule_number.asc())
        .all()
    )


@app.post("/api/v1/admin/rules", response_model=HallRuleResponse)
def create_hall_rule(
    payload: HallRuleCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing_rule = (
        db.query(HallRule)
        .filter(HallRule.rule_number == payload.rule_number)
        .first()
    )

    if existing_rule:
        if not existing_rule.is_active:
            existing_rule.section = payload.section
            existing_rule.page = payload.page
            existing_rule.text = payload.text
            existing_rule.is_active = True

            db.commit()
            db.refresh(existing_rule)

            upsert_rule_to_vector_db(existing_rule)

            return existing_rule

        raise HTTPException(
            status_code=400,
            detail="A rule with this rule number already exists.",
        )

    rule = HallRule(
        rule_number=payload.rule_number,
        section=payload.section,
        page=payload.page,
        text=payload.text,
        is_active=True,
    )

    db.add(rule)
    db.commit()
    db.refresh(rule)

    upsert_rule_to_vector_db(rule)

    return rule


@app.put("/api/v1/admin/rules/{rule_id}", response_model=HallRuleResponse)
def update_hall_rule(
    rule_id: int,
    payload: HallRuleUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rule = db.query(HallRule).filter(HallRule.id == rule_id).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found.")

    old_rule_number = rule.rule_number
    update_data = payload.model_dump(exclude_unset=True)

    if "rule_number" in update_data:
        duplicate_rule = (
            db.query(HallRule)
            .filter(HallRule.rule_number == update_data["rule_number"])
            .filter(HallRule.id != rule_id)
            .first()
        )

        if duplicate_rule:
            raise HTTPException(
                status_code=400,
                detail="Another rule with this rule number already exists.",
            )

    for key, value in update_data.items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)

    if old_rule_number != rule.rule_number:
        delete_rule_from_vector_db(old_rule_number)

    upsert_rule_to_vector_db(rule)

    return rule


@app.delete("/api/v1/admin/rules/{rule_id}")
def delete_hall_rule(
    rule_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rule = db.query(HallRule).filter(HallRule.id == rule_id).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found.")

    rule_number = rule.rule_number

    delete_rule_from_vector_db(rule_number)

    db.delete(rule)
    db.commit()

    return {
        "message": "Rule deleted successfully.",
        "rule_number": rule_number,
    }


@app.post("/api/v1/admin/rules/rebuild-index")
def rebuild_hall_rule_index(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rules = (
        db.query(HallRule)
        .filter(HallRule.is_active.is_(True))
        .order_by(HallRule.rule_number.asc())
        .all()
    )

    total_indexed = rebuild_vector_db(rules)

    return {
        "message": "Rule vector index rebuilt successfully.",
        "total_rules": total_indexed,
    }


@app.get("/api/v1/chat/sessions", response_model=list[ChatSessionResponse])
def list_my_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc(), ChatSession.id.desc())
        .all()
    )


@app.post("/api/v1/chat/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    payload: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = build_chat_title(payload.title)

    session = ChatSession(
        user_id=current_user.id,
        title=title,
        updated_at=datetime.utcnow(),
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@app.patch("/api/v1/chat/sessions/{session_id}", response_model=ChatSessionResponse)
def rename_chat_session(
    session_id: int,
    payload: ChatRenameRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .filter(ChatSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    session.title = build_chat_title(payload.title)
    session.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    return session


@app.delete("/api/v1/chat/sessions/{session_id}")
def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .filter(ChatSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    db.delete(session)
    db.commit()

    return {"message": "Chat session deleted successfully"}


@app.get(
    "/api/v1/chat/sessions/{session_id}/messages",
    response_model=list[ChatMessageResponse],
)
def list_chat_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .filter(ChatSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
        .all()
    )

    return [
        ChatMessageResponse(
            id=message.id,
            session_id=message.session_id,
            role=message.role,
            text=message.text,
            matched_rules=parse_matched_rules(message.matched_rules_json),
            created_at=message.created_at,
        )
        for message in messages
    ]


@app.post("/api/v1/chat", response_model=ChatResponse)
def chatbot_reply(
    payload: ChatSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message_text = payload.message.strip()

    if not message_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    session = None

    if payload.session_id is not None:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == payload.session_id)
            .filter(ChatSession.user_id == current_user.id)
            .first()
        )

        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")

    if session is None:
        session = ChatSession(
            user_id=current_user.id,
            title=build_chat_title(message_text),
            updated_at=datetime.utcnow(),
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    if session.title == "New chat":
        session.title = build_chat_title(message_text)

    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        text=message_text,
    )
    db.add(user_message)

    result = answer_question(db, message_text)
    matched_rules = result.get("matched_rules", [])

    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        text=result["answer"],
        matched_rules_json=json.dumps(matched_rules),
    )
    db.add(assistant_message)

    session.updated_at = datetime.utcnow()

    db.commit()

    return ChatResponse(
        session_id=session.id,
        answer=result["answer"],
        matched_rules=matched_rules,
    )