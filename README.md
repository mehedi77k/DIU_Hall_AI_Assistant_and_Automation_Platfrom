# DIU Hall AI Assistant & Automation Platform

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-5B3FD6?style=for-the-badge)
![Sentence Transformers](https://img.shields.io/badge/Sentence--Transformers-FF6F00?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Status](https://img.shields.io/badge/Status-Functional%20Prototype-success?style=for-the-badge)

A full-stack hall management and automation platform for DIU hall operations, built with **FastAPI**, **PostgreSQL**, **React**, **Docker**, **QR-based gate-pass verification**, and a **retrieval-based AI assistant** for hall-rule queries.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Run with Docker](#run-with-docker)
- [Run Manually](#run-manually)
- [Environment Variables](#environment-variables)
- [Database Migration Notes](#database-migration-notes)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [AI Assistant / RAG Flow](#ai-assistant--rag-flow)
- [Gate-Pass PDF Generation](#gate-pass-pdf-generation)
- [Gate-Pass QR Verification Flow](#gate-pass-qr-verification-flow)
- [Forgot Password Flow](#forgot-password-flow)
- [Email Notifications](#email-notifications)
- [Development Commands](#development-commands)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Overview

**DIU Hall AI Assistant & Automation Platform** is a web-based system for automating student hall-management workflows.

It allows students to:

- Register and log in
- Reset forgotten password through email
- Manage their profile
- Upload a signature
- Submit gate-pass requests
- View their own gate-pass requests
- Download approved gate-pass PDFs
- View generated verification ID
- Check whether their gate pass is used or unused
- View hall notices
- Submit complaints
- Receive in-app and optional email notifications
- Ask hall-rule-related questions through an AI assistant

It allows admins to:

- Review all gate-pass requests
- Approve or reject gate-pass requests
- Generate gate-pass PDFs
- Generate QR codes for approved gate passes
- Publish notices
- View and update complaints
- Manage hall rules
- Rebuild the chatbot vector index
- Test email notifications in development

It allows gate security users to:

- Log in through a dedicated Gate Security account
- Access the Gate Security portal
- Start the QR scanner manually
- Stop the QR scanner manually
- Scan approved gate-pass QR codes
- Verify student gate-pass details
- Confirm student exit
- Mark a gate pass as used
- Detect already-used gate passes
- Manually verify a gate pass using verification ID

The platform uses:

- **React + Vite** for the frontend
- **FastAPI** for the backend
- **PostgreSQL** for relational data
- **SQLAlchemy** for ORM
- **ChromaDB** for vector storage
- **Sentence Transformers** for hall-rule semantic search
- **ReportLab** for gate-pass PDF generation
- **qrcode[pil]** for backend QR code generation
- **html5-qrcode** for frontend QR scanning
- **SMTP** for password reset and notification emails
- **Docker Compose** for local containerized setup

---

## Repository Setup Note

GitHub renders `README.md` automatically. Keep this file named exactly:

```text
README.md
```

Do **not** commit real credentials or local secrets.

If `.env` is already committed, remove it from Git tracking:

```bash
git rm --cached --ignore-unmatch .env
echo .env >> .gitignore
git add .gitignore
git commit -m "Remove local env file from repository"
```

Use `.env.example` for placeholder values only.

---

## Core Features

### Authentication and Authorization

- Student registration
- Admin registration
- Gate Security registration
- Student login
- Admin login
- Gate Security login
- JWT-based authentication
- Current-user endpoint
- Role-based access control
- Protected student operations
- Protected admin operations
- Protected gate-security operations
- Forgot Password flow
- Password reset through email

Supported roles:

```text
student
admin
gate_security
```

### Forgot Password

- Login page includes a **Forgot Password?** option
- User enters account email
- Backend generates password reset token
- Backend sends reset email
- Email contains a **Reset Password** button
- Reset link opens frontend reset page
- User enters:
  - Email address
  - New password
  - Confirm new password
- Backend verifies token and email
- Password hash is updated
- User can log in with the new password

### Profile and Signature Upload

- Authenticated users can upload a signature image
- Supported file types:
  - `.png`
  - `.jpg`
  - `.jpeg`
- Uploaded signatures are stored under backend uploads
- Student signature is required before an approved gate-pass PDF can be generated
- Admin signature is required before approving or rejecting gate-pass requests

### Gate-Pass Management

- Students can submit gate-pass requests
- Students can view only their own gate-pass requests
- Admins can view all gate-pass requests
- Admins can approve requests
- Admins can reject requests
- Approved requests generate a PDF gate pass
- Approved requests generate a unique verification ID
- Approved requests generate a QR code
- QR code is placed at the bottom-right of the gate-pass PDF
- Gate pass can be used only once
- Already-used gate pass cannot be reused

Gate-pass PDF includes:

- Gate-pass number
- Student name
- Student ID
- Room number
- Guardian phone
- Leave date
- Return date
- Reason
- Item/details
- Approval information
- Student signature
- Admin signature
- Checker signature asset
- QR code
- Verification ID
- Scan-to-verify label

### Gate Security Portal

- Gate Security user has a separate portal
- Camera does not start automatically
- Scanner starts only after clicking **Start Scan**
- Scanner can be stopped by clicking **Stop Scan**
- Scanner stops automatically after successful QR detection
- Gate Security can also manually enter verification ID
- Valid gate pass shows full student and gate-pass details
- Security guard must click **Confirm Exit**
- Confirm Exit marks the pass as used
- Scanning the same QR again shows **Already Used**

Important rule:

```text
Scanning only verifies the gate pass.
Confirm Exit marks the gate pass as used.
```

### Notice Board

- Admins can publish notices
- Notices can include a deadline
- Students can view published notices
- Notice creation can notify active students

### Complaint Management

- Students can submit complaints
- Students can view their own complaints
- Admins can view all complaints
- Admins can update complaint status
- Supported complaint statuses:
  - `accepted`
  - `rejected`

### Notification System

- In-app notifications
- Notification list for authenticated users
- Mark one notification as read
- Mark all notifications as read
- Notification categories used by the platform:
  - `gate_pass`
  - `notice`
  - `complaint`
  - `hall_rule`

### Hall Rule Management

- Admins can create hall rules
- Admins can update hall rules
- Admins can delete hall rules
- Admins can rebuild the vector index
- Rule numbers are unique
- Active rules are indexed for chatbot retrieval

### AI Hall-Rules Chatbot

- Hall-rule question answering
- Exact rule-number lookup
- Semantic search over hall rules
- Uses Sentence Transformers for embeddings
- Uses ChromaDB as the vector store
- Returns matched hall-rule sources with the answer
- Supports chat sessions and chat history

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router DOM |
| QR Scanner | html5-qrcode |
| Backend | Python, FastAPI, Uvicorn |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT, password hashing |
| Validation | Pydantic |
| AI Retrieval | Sentence Transformers, Transformers, ChromaDB |
| Vector Model Runtime | Torch CPU |
| PDF Generation | ReportLab |
| QR Generation | qrcode[pil] |
| Email | SMTP |
| Containerization | Docker, Docker Compose |
| Static Files | FastAPI StaticFiles |

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                             User Layer                              │
│                                                                     │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌───────────────┐ │
│  │       Student       │ │        Admin        │ │ Gate Security │ │
│  │                     │ │                     │ │               │ │
│  │ - Register/Login    │ │ - Manage notices    │ │ - Login       │ │
│  │ - Upload signature  │ │ - Manage complaints │ │ - Scan QR     │ │
│  │ - Request gate pass │ │ - Approve passes    │ │ - Verify pass │ │
│  │ - Submit complaint  │ │ - Manage rules      │ │ - Confirm use │ │
│  │ - View notices      │ │ - Rebuild index     │ │ - Check used  │ │
│  │ - Use chatbot       │ │ - Test email        │ │               │ │
│  └──────────┬──────────┘ └──────────┬──────────┘ └───────┬───────┘ │
└─────────────┼───────────────────────┼────────────────────┼─────────┘
              │                       │                    │
              ▼                       ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                             │
│                                                                     │
│                         React + Vite SPA                            │
│                                                                     │
│ Pages: Login, Register, Forgot Password, Reset Password, Dashboard, │
│ Profile, Gate Pass, Gate Security, Notice Board, Complaints,        │
│ Chatbot, Admin Rule Management                                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ REST API + JWT Bearer Token
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Backend Layer                             │
│                                                                     │
│                            FastAPI API                              │
│                                                                     │
│ Modules: Auth, Users, Gate Passes, Gate Security, Notices,          │
│ Notifications, Complaints, Hall Rules, Chatbot, PDF Generation,     │
│ QR Generation, Email                                                │
└───────────────┬───────────────────────────────┬─────────────────────┘
                │                               │
                ▼                               ▼
┌──────────────────────────────┐     ┌───────────────────────────────┐
│        PostgreSQL DB          │     │        Upload Storage          │
│                              │     │                               │
│ - users                      │     │ - User signatures              │
│ - gate_passes                │     │ - Gate-pass PDFs               │
│ - notices                    │     │ - Gate-pass QR codes           │
│ - complaints                 │     │ - Signature assets             │
│ - notifications              │     └───────────────────────────────┘
│ - hall_rules                 │
│ - chat_sessions              │
│ - chat_messages              │
└───────────────┬──────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            AI / RAG Layer                           │
│                                                                     │
│ Hall Rules JSON → PostgreSQL → Sentence Transformer Embeddings      │
│ → ChromaDB → Retrieval → Chatbot Answer                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```text
DIU_Hall_AI_Assistant_and_Automation_Platfrom
│
├── backend
│   ├── app
│   │   ├── core
│   │   │   ├── config.py
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   │
│   │   ├── data
│   │   │   ├── processed
│   │   │   │   └── chunks_updated.json
│   │   │   └── vectordb
│   │   │
│   │   ├── db
│   │   │   ├── base.py
│   │   │   ├── seed_hall_rules.py
│   │   │   └── session.py
│   │   │
│   │   ├── models
│   │   │   ├── chat.py
│   │   │   ├── complaint.py
│   │   │   ├── gate_pass.py
│   │   │   ├── hall_rule.py
│   │   │   ├── notice.py
│   │   │   ├── notification.py
│   │   │   ├── user.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── schemas
│   │   │   └── common.py
│   │   │
│   │   ├── services
│   │   │   ├── notifications.py
│   │   │   └── rag
│   │   │       ├── answering.py
│   │   │       ├── indexer.py
│   │   │       └── retrieval.py
│   │   │
│   │   └── main.py
│   │
│   ├── assets
│   │   └── signatures
│   │       └── checker_signature.png
│   │
│   ├── uploads
│   │   ├── signatures
│   │   │   └── students
│   │   ├── gate_pass_pdfs
│   │   └── gate_pass_qr_codes
│   │
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend
│   ├── src
│   │   ├── components
│   │   │   └── NotificationBell.jsx
│   │   │
│   │   ├── pages
│   │   │   ├── AdminRulesPage.jsx
│   │   │   ├── ChatbotPage.jsx
│   │   │   ├── ComplaintsPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── GatePassPage.jsx
│   │   │   ├── GateSecurityPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── NoticeBoardPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   │
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── docker-compose.yml
├── README.md
├── .env.example
└── .gitignore
```

---

## Prerequisites

Install the following before running the project:

- Git
- Docker
- Docker Compose
- Node.js 20+ if running the frontend manually
- Python 3.12+ if running the backend manually
- PostgreSQL if running without Docker
- pgAdmin 4 optionally, for manual database queries

---

## Run with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/mehedi77k/DIU_Hall_AI_Assistant_and_Automation_Platfrom.git
cd DIU_Hall_AI_Assistant_and_Automation_Platfrom
```

### 2. Create a Local `.env` File

Create a `.env` file in the project root.

```env
DATABASE_URL=postgresql+psycopg://diu_user:diu_password@db:5432/diu_hall

APP_NAME=DIU Hall AI Assistant and Automation Platform
APP_ENV=development

BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]

EMAIL_NOTIFICATIONS_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_USE_TLS=true

GROQ_API_KEY=
GEMINI_API_KEY=

GROQ_MODEL=llama-3.1-8b-instant
GEMINI_MODEL=gemini-2.5-flash

LLM_ENABLED=true
LLM_TEMPERATURE=0.2
LLM_MAX_OUTPUT_TOKENS=500

PUBLIC_BACKEND_URL=http://localhost:8000
PUBLIC_FRONTEND_URL=http://localhost:5173

PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=30

BACKEND_PORT=8000
FRONTEND_PORT=5173
DB_PORT=55432
```

For Gmail SMTP, use a Gmail App Password instead of your normal Gmail password.

### 3. Start the Application

```bash
docker compose up --build
```

### 4. Open the Application

Frontend:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:8000
```

Swagger API Docs:

```text
http://localhost:8000/docs
```

PostgreSQL host port:

```text
localhost:55432
```

Default Docker database values:

```text
Database: diu_hall
User: diu_user
Password: diu_password
Host: localhost
Port: 55432
```

---

## Run Manually

Use this method if you do not want to use Docker.

### 1. Clone the Repository

```bash
git clone https://github.com/mehedi77k/DIU_Hall_AI_Assistant_and_Automation_Platfrom.git
cd DIU_Hall_AI_Assistant_and_Automation_Platfrom
```

### 2. Create PostgreSQL Database

```sql
CREATE DATABASE diu_hall;
CREATE USER diu_user WITH PASSWORD 'diu_password';
GRANT ALL PRIVILEGES ON DATABASE diu_hall TO diu_user;
```

### 3. Configure Environment Variables

Create a `.env` file in the backend runtime environment.

```env
APP_NAME=DIU Hall AI Assistant and Automation Platform
APP_ENV=development
DATABASE_URL=postgresql+psycopg://diu_user:diu_password@localhost:5432/diu_hall
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]

EMAIL_NOTIFICATIONS_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_USE_TLS=true

PUBLIC_BACKEND_URL=http://localhost:8000
PUBLIC_FRONTEND_URL=http://localhost:5173

PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=30

ANONYMIZED_TELEMETRY=False
```

### 4. Install Backend Dependencies

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

If QR generation package is missing:

```bash
pip install "qrcode[pil]"
```

### 5. Run the Backend

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend URL:

```text
http://localhost:8000
```

### 6. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

If QR scanner package is missing:

```bash
npm install html5-qrcode
```

### 7. Run the Frontend

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `APP_NAME` | Backend application name | `DIU Hall AI Assistant and Automation Platform` |
| `APP_ENV` | Runtime environment | `development` |
| `DATABASE_URL` | SQLAlchemy database URL | `postgresql+psycopg://diu_user:diu_password@db:5432/diu_hall` |
| `BACKEND_CORS_ORIGINS` | Allowed frontend origins | `["http://localhost:5173","http://127.0.0.1:5173"]` |
| `EMAIL_NOTIFICATIONS_ENABLED` | Enable or disable SMTP email notifications | `false` |
| `SMTP_HOST` | SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | SMTP username | `example@gmail.com` |
| `SMTP_PASSWORD` | SMTP password or app password | `your_app_password` |
| `SMTP_FROM_EMAIL` | Sender email | `example@gmail.com` |
| `SMTP_USE_TLS` | Enable TLS for SMTP | `true` |
| `PUBLIC_BACKEND_URL` | Backend public URL | `http://localhost:8000` |
| `PUBLIC_FRONTEND_URL` | Frontend public URL | `http://localhost:5173` |
| `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES` | Password reset token expiry | `30` |
| `GROQ_API_KEY` | Groq API key | empty |
| `GEMINI_API_KEY` | Gemini API key | empty |
| `GROQ_MODEL` | Groq model | `llama-3.1-8b-instant` |
| `GEMINI_MODEL` | Gemini model | `gemini-2.5-flash` |
| `LLM_ENABLED` | Enable LLM generation | `true` |
| `LLM_TEMPERATURE` | LLM temperature | `0.2` |
| `LLM_MAX_OUTPUT_TOKENS` | Max output tokens | `500` |
| `ANONYMIZED_TELEMETRY` | Disable Chroma telemetry | `False` |

---

## Database Migration Notes

This project currently uses:

```text
Base.metadata.create_all(bind=engine)
```

This creates new tables, but it does not automatically add new columns to existing tables.

If your database already exists and you added QR verification fields, run this SQL manually in pgAdmin 4 Query Tool or terminal.

```sql
ALTER TABLE gate_passes
ADD COLUMN IF NOT EXISTS verification_id VARCHAR(80);

CREATE UNIQUE INDEX IF NOT EXISTS ix_gate_passes_verification_id
ON gate_passes (verification_id);

ALTER TABLE gate_passes
ADD COLUMN IF NOT EXISTS qr_code_path VARCHAR(255);

ALTER TABLE gate_passes
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP;

ALTER TABLE gate_passes
ADD COLUMN IF NOT EXISTS used_by_security_id INTEGER;
```

Using Docker terminal:

```bash
docker compose exec db psql -U diu_user -d diu_hall
```

Then paste the SQL.

Exit psql:

```sql
\q
```

---

## API Endpoints

Base URL:

```text
http://localhost:8000
```

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Backend root response |
| `GET` | `/api/v1/health` | Health check |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register student, admin, or gate security |
| `POST` | `/api/v1/auth/login` | Log in and receive a JWT |
| `GET` | `/api/v1/auth/me` | Get current authenticated user |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset email |
| `POST` | `/api/v1/auth/reset-password` | Reset password using reset token |

Register role values:

```text
student
admin
gate_security
```

Student register example:

```json
{
  "full_name": "Mehedi Hasan",
  "student_id": "241-50-001",
  "email": "student@example.com",
  "phone": "01700000000",
  "password": "123456",
  "role": "student"
}
```

Gate Security register example:

```json
{
  "full_name": "Gate Security 1",
  "student_id": "SEC-001",
  "email": "security@example.com",
  "phone": "01700000000",
  "password": "123456",
  "role": "gate_security"
}
```

Login example:

```json
{
  "email": "student@example.com",
  "password": "123456"
}
```

Forgot password example:

```json
{
  "email": "student@example.com"
}
```

Reset password example:

```json
{
  "email": "student@example.com",
  "token": "reset-token-here",
  "new_password": "123456",
  "confirm_new_password": "123456"
}
```

### User Profile

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/users/me/signature` | Authenticated | Upload current user's signature |

### Gate Pass

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/gate-passes` | Student/Admin | List gate passes |
| `POST` | `/api/v1/gate-passes` | Student | Submit a gate-pass request |
| `POST` | `/api/v1/gate-passes/{gate_pass_id}/approve` | Admin | Approve a request, generate QR, and generate PDF |
| `POST` | `/api/v1/gate-passes/{gate_pass_id}/reject` | Admin | Reject a request |

Gate pass submit example:

```json
{
  "room_no": "NB-416",
  "leave_date": "2026-05-02",
  "return_date": "2026-05-14",
  "guardian_phone": "01723857881",
  "reason": "Eid vacation",
  "item_list": "Bag, laptop"
}
```

### Gate Security

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/gate-security/gate-pass/{verification_id}` | Gate Security | Verify scanned or manual gate pass |
| `POST` | `/api/v1/gate-security/gate-pass/{verification_id}/use` | Gate Security | Mark gate pass as used |

Possible verification statuses:

```text
valid
used
already_used
invalid
not_approved
```

Valid response example:

```json
{
  "status": "valid",
  "message": "Gate pass is valid.",
  "gate_pass": {
    "id": 8,
    "verification_id": "GP-0008-98D79EC0A5EE",
    "student_name": "Mehedi Hasan",
    "student_id": "241-50-001",
    "room_no": "NB-416",
    "leave_date": "2026-05-02",
    "return_date": "2026-05-14",
    "guardian_phone": "01723857881",
    "reason": "Eid vacation",
    "item_list": "Bag",
    "status": "approved",
    "approved_by": "Admin Name",
    "pdf_path": "/uploads/gate_pass_pdfs/gate_pass_8_20260509_160900.pdf",
    "used_at": null,
    "used_by_security_id": null,
    "created_at": "2026-05-09T16:09:00"
  }
}
```

Already used response example:

```json
{
  "status": "already_used",
  "message": "This gate pass has already been used.",
  "gate_pass": {
    "id": 8,
    "verification_id": "GP-0008-98D79EC0A5EE",
    "student_name": "Mehedi Hasan",
    "student_id": "241-50-001",
    "used_at": "2026-05-09T18:20:00",
    "used_by_security_id": 4
  }
}
```

### Notices

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/notices` | Public | List notices |
| `POST` | `/api/v1/notices` | Admin | Create a notice |

### Notifications

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Authenticated | List current user's notifications |
| `POST` | `/api/v1/notifications/{notification_id}/read` | Authenticated | Mark one notification as read |
| `POST` | `/api/v1/notifications/read-all` | Authenticated | Mark all notifications as read |

### Complaints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/complaints` | Student/Admin | List complaints |
| `POST` | `/api/v1/complaints` | Student | Submit a complaint |
| `POST` | `/api/v1/complaints/{complaint_id}/status` | Admin | Update complaint status |

Supported complaint status values:

```text
accepted
rejected
```

### Hall Rule Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/rules` | Admin | List active hall rules |
| `POST` | `/api/v1/admin/rules` | Admin | Create a hall rule |
| `PUT` | `/api/v1/admin/rules/{rule_id}` | Admin | Update a hall rule |
| `DELETE` | `/api/v1/admin/rules/{rule_id}` | Admin | Delete a hall rule |
| `POST` | `/api/v1/admin/rules/rebuild-index` | Admin | Rebuild ChromaDB vector index |

### Chatbot

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/chat/sessions` | Authenticated | List chat sessions |
| `POST` | `/api/v1/chat/sessions` | Authenticated | Create chat session |
| `PATCH` | `/api/v1/chat/sessions/{session_id}` | Authenticated | Rename chat session |
| `DELETE` | `/api/v1/chat/sessions/{session_id}` | Authenticated | Delete chat session |
| `GET` | `/api/v1/chat/sessions/{session_id}/messages` | Authenticated | List chat messages |
| `POST` | `/api/v1/chat` | Authenticated | Ask a hall-rule question |

Example request:

```json
{
  "message": "What is rule 5?",
  "session_id": 1
}
```

Example response:

```json
{
  "session_id": 1,
  "answer": "According to Rule 5...",
  "matched_rules": [
    {
      "id": 5,
      "rule_number": 5,
      "section": "Hall Rules",
      "page": 1,
      "text": "Rule text here"
    }
  ]
}
```

### Development Email Test

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/dev/test-email` | Admin | Send a test email in development mode |

Example request:

```json
{
  "to_email": "student@example.com"
}
```

---

## Database Models

### `users`

Stores student, admin, and gate-security account data.

| Field | Description |
|---|---|
| `id` | Primary key |
| `full_name` | User full name |
| `student_id` | Student/admin/security ID |
| `email` | Unique email |
| `phone` | Optional phone number |
| `role` | `student`, `admin`, or `gate_security` |
| `password_hash` | Hashed password |
| `signature_image_path` | Uploaded signature path |
| `is_active` | Account active status |
| `created_at` | Account creation time |

### `gate_passes`

Stores gate-pass requests, QR verification data, and usage tracking.

| Field | Description |
|---|---|
| `id` | Primary key |
| `student_name` | Student name |
| `student_id` | Student ID |
| `room_no` | Room number |
| `leave_date` | Leave date |
| `return_date` | Return date |
| `guardian_phone` | Guardian phone number |
| `reason` | Reason for leave |
| `item_list` | Items/details |
| `status` | `pending`, `approved`, or `rejected` |
| `approved_by` | Admin who approved |
| `pdf_path` | Generated PDF path |
| `verification_id` | Unique QR verification ID |
| `qr_code_path` | Generated QR image path |
| `used_at` | Time when gate pass was confirmed as used |
| `used_by_security_id` | Gate Security user ID who confirmed exit |
| `created_at` | Request creation time |

### `notices`

Stores hall notices.

| Field | Description |
|---|---|
| `id` | Primary key |
| `title` | Notice title |
| `content` | Notice body |
| `deadline` | Optional deadline |
| `posted_by` | Admin name |
| `created_at` | Notice creation/publish date |

### `complaints`

Stores student complaints.

| Field | Description |
|---|---|
| `id` | Primary key |
| `student_name` | Student name |
| `student_id` | Student ID |
| `room_no` | Room number |
| `category` | Complaint category |
| `description` | Complaint details |
| `status` | Complaint status |
| `created_at` | Submission time |

### `notifications`

Stores in-app notifications.

| Field | Description |
|---|---|
| `id` | Primary key |
| `recipient_user_id` | Notification receiver |
| `title` | Notification title |
| `message` | Notification message |
| `category` | Notification category |
| `is_read` | Read/unread status |
| `entity_type` | Related entity type |
| `entity_id` | Related entity ID |
| `action_url` | Frontend deep link |
| `created_at` | Notification creation time |

### `hall_rules`

Stores hall rules used by the chatbot.

| Field | Description |
|---|---|
| `id` | Primary key |
| `rule_number` | Unique rule number |
| `section` | Rule section |
| `page` | Source page number |
| `text` | Rule text |
| `is_active` | Active/inactive status |
| `created_at` | Creation time |
| `updated_at` | Last update time |

### `chat_sessions` and `chat_messages`

These models store user chatbot sessions and messages.

---

## AI Assistant / RAG Flow

The chatbot answers hall-rule-related questions using retrieval-based logic.

```text
User Question
    │
    ▼
Exact Rule Number Detection
    │
    ├── If rule number is found:
    │       Query PostgreSQL hall_rules table directly
    │
    └── If no exact rule number:
            Embed question with Sentence Transformers
            Search ChromaDB vector store
            Retrieve relevant hall rules
            Format answer with matched sources
```

Hall rules are seeded from:

```text
backend/app/data/processed/chunks_updated.json
```

Vector database path:

```text
backend/app/data/vectordb
```

Vector collection:

```text
hostel_rules
```

Embedding model:

```text
all-MiniLM-L6-v2
```

---

## Gate-Pass PDF Generation

When an admin approves a gate-pass request, the backend generates a PDF using ReportLab.

Generated PDFs are stored under:

```text
backend/uploads/gate_pass_pdfs
```

Generated QR codes are stored under:

```text
backend/uploads/gate_pass_qr_codes
```

Uploaded user signatures are stored under:

```text
backend/uploads/signatures/students
```

Signature assets are expected under:

```text
backend/assets/signatures
```

Expected asset files:

```text
checker_signature.png
```

The generated PDF includes student information, leave details, approval details, signature boxes, QR code, and verification ID.

---

## Gate-Pass QR Verification Flow

```text
Student submits gate pass request
        ↓
Admin approves request
        ↓
System generates verification_id
        ↓
System generates QR code
        ↓
System generates PDF with QR code
        ↓
Student downloads/prints PDF
        ↓
Student shows PDF to gate security
        ↓
Gate Security opens portal
        ↓
Gate Security clicks Start Scan
        ↓
Gate Security scans QR code
        ↓
System shows gate-pass details
        ↓
Gate Security clicks Confirm Exit
        ↓
System sets used_at and used_by_security_id
        ↓
Same QR scanned again shows Already Used
```

QR content format:

```text
http://localhost:5173/gate-security/verify/<verification_id>
```

Example:

```text
http://localhost:5173/gate-security/verify/GP-0008-98D79EC0A5EE
```

Security rule:

```text
Scanning verifies only.
Confirm Exit marks the gate pass as used.
```

---

## Forgot Password Flow

```text
User clicks Forgot Password
        ↓
User enters email
        ↓
Backend creates password reset token
        ↓
Backend sends reset email
        ↓
User clicks Reset Password button
        ↓
Frontend reset page opens
        ↓
User enters email, new password, confirm password
        ↓
Backend verifies token
        ↓
Backend updates password
        ↓
User logs in with new password
```

Reset link format:

```text
http://localhost:5173/reset-password?token=<token>&email=<email>
```

---

## Email Notifications

The backend includes SMTP-based email notification support.

Email notifications can be enabled or disabled through:

```env
EMAIL_NOTIFICATIONS_ENABLED=true
```

For local development, disable email notifications unless SMTP is configured:

```env
EMAIL_NOTIFICATIONS_ENABLED=false
```

Email is used for:

- Password reset
- Gate-pass approval
- Gate-pass rejection
- Notice notification
- Complaint status update
- Hall rule update
- Development test email

### Gmail SMTP Setup

If using Gmail:

1. Use a dedicated Gmail sender account.
2. Enable 2-Step Verification.
3. Generate a Gmail App Password.
4. Use the app password in `.env`.
5. Do not use your normal Gmail password.

Example:

```env
EMAIL_NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_sender_email@gmail.com
SMTP_PASSWORD=your_16_character_app_password
SMTP_FROM_EMAIL=your_sender_email@gmail.com
SMTP_USE_TLS=true
```

Test email endpoint:

```text
POST /api/v1/dev/test-email
```

Check backend logs:

```bash
docker compose logs backend --tail=200
```

PowerShell filter:

```powershell
docker compose logs backend --tail=200 | Select-String "Email"
```

---

## Development Commands

### Docker

Start all services:

```bash
docker compose up --build
```

Stop services:

```bash
docker compose down
```

Stop services and remove database volume:

```bash
docker compose down -v
```

View logs:

```bash
docker compose logs -f
```

View backend logs:

```bash
docker compose logs -f backend
```

View frontend logs:

```bash
docker compose logs -f frontend
```

Check service status:

```bash
docker compose ps
```

### Backend

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Install QR package manually:

```bash
pip install "qrcode[pil]"
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Install QR scanner package:

```bash
npm install html5-qrcode
```

Check QR package:

```bash
npm list html5-qrcode
```

Build frontend:

```bash
cd frontend
npm run build
```

Preview frontend build:

```bash
cd frontend
npm run preview
```

---

## Troubleshooting

### Docker Build Is Slow

The backend installs PyTorch, Transformers, Sentence Transformers, and ChromaDB. The first build can take time.

Try:

```bash
docker compose build backend
docker compose up
```

### Backend Cannot Connect to Database

Check service status:

```bash
docker compose ps
```

Check database logs:

```bash
docker compose logs db
```

When running inside Docker, the database host must be the Docker service name:

```text
db
```

Docker database URL:

```text
postgresql+psycopg://diu_user:diu_password@db:5432/diu_hall
```

Manual local database URL:

```text
postgresql+psycopg://diu_user:diu_password@localhost:5432/diu_hall
```

### Frontend Cannot Connect to Backend

Check backend health:

```text
http://localhost:8000/api/v1/health
```

Confirm CORS includes the frontend origin:

```env
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

### Frontend Opens Dashboard Instead of Login

Old login data may exist in browser storage.

Open browser console and run:

```js
localStorage.clear()
sessionStorage.clear()
```

Then reload:

```text
http://localhost:5173
```

### Chatbot Returns No Relevant Answer

Check that:

- Hall rules exist in the database.
- `chunks_updated.json` exists.
- ChromaDB vector store has been created.
- Admin has rebuilt the vector index after rule changes.
- The question is related to hall rules.

### Gate-Pass Approval Fails

Check that:

- Current user is an admin.
- Gate-pass request exists.
- Student account exists.
- Student has uploaded a signature.
- Admin has uploaded a signature.
- Upload directories are writable.
- Signature assets exist if required for PDF rendering.
- `qrcode[pil]` is installed.
- Database has QR-related columns.

### QR Code Is Not Showing in PDF

Check that:

- `qrcode[pil]` is installed.
- `verification_id` exists.
- `qr_code_path` exists.
- QR image exists in `uploads/gate_pass_qr_codes`.
- PDF was generated after QR code generation.
- Old PDFs need regeneration.

### Gate Security Camera Opens Automatically

Expected behavior:

```text
Page reload → Scanner off
Click Start Scan → Camera on
Click Stop Scan → Camera off
QR detected → Scanner stops automatically
```

If camera opens automatically, check `GateSecurityPage.jsx`. It should use:

```text
Html5Qrcode
```

not:

```text
Html5QrcodeScanner
```

### Gate Security Cannot Verify QR

Check that:

- Gate Security user is logged in.
- User role is exactly `gate_security`.
- Gate pass is approved.
- `verification_id` exists.
- Backend is running.
- Token exists in browser session.
- QR contains correct verification URL.

### Gate Pass Shows Already Used

This is expected if the security guard already clicked **Confirm Exit**.

The system prevents using the same gate pass more than once.

### Missing Database Columns

If backend shows:

```text
column gate_passes.verification_id does not exist
```

Run:

```sql
ALTER TABLE gate_passes
ADD COLUMN IF NOT EXISTS verification_id VARCHAR(80);

CREATE UNIQUE INDEX IF NOT EXISTS ix_gate_passes_verification_id
ON gate_passes (verification_id);

ALTER TABLE gate_passes
ADD COLUMN IF NOT EXISTS qr_code_path VARCHAR(255);

ALTER TABLE gate_passes
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP;

ALTER TABLE gate_passes
ADD COLUMN IF NOT EXISTS used_by_security_id INTEGER;
```

### Email Notifications Are Not Sent

Check that:

- `EMAIL_NOTIFICATIONS_ENABLED=true`
- SMTP host, port, username, password, and sender email are configured
- Gmail uses an App Password
- Recipient email is valid
- Backend logs do not show SMTP errors

Common Gmail SMTP error:

```text
535 5.7.8 Username and Password not accepted
```

This usually means the SMTP username/password is wrong or a Gmail App Password was not used.

---

## Security Notes

Before using this project in production:

- Remove `.env` from Git tracking.
- Never commit real credentials.
- Rotate any exposed API keys or SMTP passwords.
- Use a strong JWT secret from environment variables.
- Restrict CORS to trusted frontend domains.
- Use HTTPS.
- Disable development reload mode.
- Validate uploaded files carefully.
- Add upload file-size limits.
- Restrict admin registration.
- Restrict gate-security registration.
- Create admin/security users from admin-only flow.
- Use proper database migrations, such as Alembic.
- Store SMTP credentials securely.
- Use a transactional email provider for production.
- Protect generated PDF download routes.
- Protect QR image download routes if needed.
- Back up PostgreSQL data.
- Back up uploaded signatures and generated PDFs.
- Review authorization checks for all admin and gate-security routes.
- Add rate limiting for login and forgot-password endpoints.
- Make password reset tokens one-time-use in production.
- Add audit logs for Gate Security actions.

---

## Known Limitations

- The system currently uses startup-based table creation instead of formal migrations.
- Existing database schemas may require manual updates when models change.
- Password reset token is JWT-based, not a one-time database token.
- Admin registration may be open during development.
- Gate Security registration may be open during development.
- Old PDFs do not automatically get QR codes.
- QR and PDF files are stored locally.
- The AI assistant quality depends on the hall-rule dataset.
- Vector model loading can increase backend startup time.
- SMTP delivery depends on external email-provider configuration.
- Generated PDFs and uploads are served from local static storage in development.
- Production deployment requires additional hardening.

---

## Future Improvements

- Alembic database migrations
- Protected admin registration
- Gate Security account creation by admin
- Dedicated admin seeding command
- One-time password reset token table
- Email verification
- Gate-pass QR scan history
- Gate-pass regenerate PDF endpoint
- Protected PDF download endpoint
- Protected QR download endpoint
- Gate-pass download history
- Complaint priority levels
- Complaint comments or admin notes
- Real-time notifications with WebSocket
- Notification deep links
- Notification delivery tracking
- Email retry queue with Celery or RQ
- Admin analytics dashboard
- Gate Security activity log
- Hall occupancy management
- Room allocation module
- Visitor management module
- CSV/PDF report exports
- CI/CD workflow with GitHub Actions
- Automated backend and frontend tests
- Improved chatbot confidence scoring
- Multi-language chatbot support
- Cloud deployment configuration

---

## Repository

```text
https://github.com/mehedi77k/DIU_Hall_AI_Assistant_and_Automation_Platfrom
```

---

## Project Status

```text
Status: Functional Prototype
Project Type: Hall Management and Automation Platform
Frontend: React + Vite
Backend: FastAPI
Database: PostgreSQL
AI Layer: Sentence Transformers + ChromaDB
Containerization: Docker Compose
Notification System: In-app + Optional SMTP Email
PDF Generation: ReportLab
QR Generation: qrcode[pil]
QR Scanner: html5-qrcode
Authentication: JWT
Roles: student, admin, gate_security
```