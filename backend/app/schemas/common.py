from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class GatePassCreate(BaseModel):
    room_no: str
    leave_date: date
    return_date: date
    guardian_phone: str
    reason: str
    item_list: str


class GatePassResponse(BaseModel):
    id: int
    student_name: str
    student_id: str
    room_no: str
    leave_date: date
    return_date: date
    guardian_phone: str
    reason: str
    item_list: str
    status: str
    exit: str = "No"
    approved_by: str | None = None
    pdf_path: str | None = None

    # QR / Gate Security fields
    verification_id: str | None = None
    qr_code_path: str | None = None
    used_at: datetime | None = None
    used_by_security_id: int | None = None

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GateSecurityGatePassResponse(BaseModel):
    id: int
    verification_id: str
    student_name: str
    student_id: str
    room_no: str
    leave_date: date
    return_date: date
    guardian_phone: str
    reason: str
    item_list: str
    status: str
    exit: str = "No"
    approved_by: str | None = None
    pdf_path: str | None = None
    used_at: datetime | None = None
    used_by_security_id: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GateSecurityVerificationResponse(BaseModel):
    status: str
    message: str
    gate_pass: GateSecurityGatePassResponse | None = None


class NoticeCreate(BaseModel):
    title: str
    content: str
    publish_date: date
    deadline: date | None = None


class NoticeResponse(BaseModel):
    id: int
    title: str
    content: str
    deadline: date | None = None
    posted_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: int
    recipient_user_id: int
    title: str
    message: str
    category: str
    is_read: bool
    entity_type: str | None = None
    entity_id: int | None = None
    action_url: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintCreate(BaseModel):
    room_no: str
    category: str
    description: str


class ComplaintResponse(BaseModel):
    id: int
    student_name: str
    student_id: str
    room_no: str
    category: str
    description: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintStatusUpdate(BaseModel):
    status: Literal["accepted", "rejected"]


class MatchedRule(BaseModel):
    id: int | str
    rule_number: int
    section: str
    page: int | None = None
    text: str

    model_config = ConfigDict(from_attributes=True)


class ChatSendRequest(BaseModel):
    message: str
    session_id: int | None = None


class ChatSessionCreate(BaseModel):
    title: str = "New chat"


class ChatRenameRequest(BaseModel):
    title: str


class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    text: str
    matched_rules: list[MatchedRule] = Field(default_factory=list)
    created_at: datetime


class ChatResponse(BaseModel):
    session_id: int
    answer: str
    matched_rules: list[MatchedRule] = Field(default_factory=list)


class TestEmailRequest(BaseModel):
    to_email: str


class UserRegister(BaseModel):
    full_name: str
    student_id: str
    email: EmailStr
    phone: str | None = None
    password: str
    role: Literal["student", "admin", "gate_security"] = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str
    confirm_new_password: str


class MessageResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    student_id: str
    email: EmailStr
    phone: str | None = None
    role: str
    signature_image_path: str | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class HallRuleCreate(BaseModel):
    rule_number: int
    section: str
    page: int | None = None
    text: str


class HallRuleUpdate(BaseModel):
    rule_number: int | None = None
    section: str | None = None
    page: int | None = None
    text: str | None = None
    is_active: bool | None = None


class HallRuleResponse(BaseModel):
    id: int
    rule_number: int
    section: str
    page: int | None = None
    text: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)