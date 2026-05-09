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

A full-stack hall management and automation platform for DIU hall operations, built with **FastAPI**, **PostgreSQL**, **React**, **Docker**, and a **retrieval-based AI assistant** for hall-rule queries.

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
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [AI Assistant / RAG Flow](#ai-assistant--rag-flow)
- [Gate-Pass PDF Generation](#gate-pass-pdf-generation)
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
- Manage their profile
- Upload a signature
- Submit gate-pass requests
- View hall notices
- Submit complaints
- Receive in-app and optional email notifications
- Ask hall-rule-related questions through an AI assistant

It allows admins to:

- Review all gate-pass requests
- Approve or reject gate-pass requests
- Generate gate-pass PDFs
- Publish notices
- View and update complaints
- Manage hall rules
- Rebuild the chatbot vector index
- Test email notifications in development

The platform uses:

- **React + Vite** for the frontend
- **FastAPI** for the backend
- **PostgreSQL** for relational data
- **SQLAlchemy** for ORM
- **ChromaDB** for vector storage
- **Sentence Transformers** for hall-rule semantic search
- **ReportLab** for gate-pass PDF generation
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

- Student and admin registration
- Student and admin login
- JWT-based authentication
- Current-user endpoint
- Role-based access control
- Protected admin operations

### Profile and Signature Upload

- Authenticated users can upload a signature image
- Supported file types:
  - `.png`
  - `.jpg`
  - `.jpeg`
- Uploaded signatures are stored under backend uploads
- Student signature is required before an approved gate-pass PDF can be generated

### Gate-Pass Management

- Students can submit gate-pass requests
- Students can view only their own gate-pass requests
- Admins can view all gate-pass requests
- Admins can approve requests
- Admins can reject requests
- Approved requests generate a PDF gate pass
- Gate-pass PDF includes:
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
  - Admin signature asset
  - Checker signature asset

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

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router DOM |
| Backend | Python, FastAPI, Uvicorn |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT, password hashing |
| Validation | Pydantic |
| AI Retrieval | Sentence Transformers, Transformers, ChromaDB |
| Vector Model Runtime | Torch CPU |
| PDF Generation | ReportLab |
| Email | SMTP |
| Containerization | Docker, Docker Compose |
| Static Files | FastAPI StaticFiles |

---

## System Architecture

```text
┌───────────────────────────────────────────────────────────────┐
│                         User Layer                            │
│                                                               │
│  ┌─────────────────────┐        ┌─────────────────────┐       │
│  │       Student       │        │        Admin        │       │
│  │                     │        │                     │       │
│  │ - Register/Login    │        │ - Manage notices    │       │
│  │ - Upload signature  │        │ - Manage complaints │       │
│  │ - Request gate pass │        │ - Approve passes    │       │
│  │ - Submit complaint  │        │ - Manage rules      │       │
│  │ - View notices      │        │ - Rebuild index     │       │
│  │ - Use chatbot       │        │ - Test email        │       │
│  └──────────┬──────────┘        └──────────┬──────────┘       │
└─────────────┼──────────────────────────────┼──────────────────┘
              │                              │
              ▼                              ▼
┌───────────────────────────────────────────────────────────────┐
│                       Frontend Layer                          │
│                                                               │
│                    React + Vite SPA                           │
│                                                               │
│  Pages: Login, Register, Dashboard, Profile, Gate Pass,        │
│  Notice Board, Complaints, Chatbot, Admin Rule Management      │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                │ REST API + JWT Bearer Token
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                        Backend Layer                          │
│                                                               │
│                         FastAPI API                           │
│                                                               │
│  Modules: Auth, Users, Gate Passes, Notices, Notifications,    │
│  Complaints, Hall Rules, Chatbot, PDF Generation               │
└───────────────┬───────────────────────────────┬───────────────┘
                │                               │
                ▼                               ▼
┌──────────────────────────────┐     ┌─────────────────────────┐
│       PostgreSQL DB          │     │      Upload Storage      │
│                              │     │                         │
│ - users                      │     │ - User signatures        │
│ - gate_passes                │     │ - Gate-pass PDFs         │
│ - notices                    │     │ - Signature assets       │
│ - complaints                 │     └─────────────────────────┘
│ - notifications              │
│ - hall_rules                 │
│ - chat_sessions              │
│ - chat_messages              │
└───────────────┬──────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│                         AI / RAG Layer                        │
│                                                               │
│  Hall Rules JSON → PostgreSQL → Sentence Transformer           │
│  Embeddings → ChromaDB → Retrieval → Chatbot Answer            │
└───────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```text
DIU-Hall-AI-Assistant
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
│   │
│   ├── uploads
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
│   │   │   ├── GatePassPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── NoticeBoardPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── RegisterPage.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   │
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── README.md
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

---

## Run with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/mehedi77k/DIU-Hall-AI-Assistant.git
cd DIU-Hall-AI-Assistant
```

### 2. Create a Local `.env` File

Create a `.env` file in the project root.

```env
EMAIL_NOTIFICATIONS_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_USE_TLS=true
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
git clone https://github.com/mehedi77k/DIU-Hall-AI-Assistant.git
cd DIU-Hall-AI-Assistant
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
| `ANONYMIZED_TELEMETRY` | Disable Chroma telemetry | `False` |

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
| `POST` | `/api/v1/auth/register` | Register a student or admin |
| `POST` | `/api/v1/auth/login` | Log in and receive a JWT |
| `GET` | `/api/v1/auth/me` | Get current authenticated user |

### User Profile

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/users/me/signature` | Authenticated | Upload current user's signature |

### Gate Pass

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/gate-passes` | Student/Admin | List gate passes |
| `POST` | `/api/v1/gate-passes` | Student | Submit a gate-pass request |
| `POST` | `/api/v1/gate-passes/{gate_pass_id}/approve` | Admin | Approve a request and generate PDF |
| `POST` | `/api/v1/gate-passes/{gate_pass_id}/reject` | Admin | Reject a request |

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
| `POST` | `/api/v1/chat` | Public/API-level | Ask a hall-rule question |

Example request:

```json
{
  "message": "What is rule 5?"
}
```

Example response:

```json
{
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

Stores student and admin account data.

| Field | Description |
|---|---|
| `id` | Primary key |
| `full_name` | User full name |
| `student_id` | Student/admin ID |
| `email` | Unique email |
| `phone` | Optional phone number |
| `role` | `student` or `admin` |
| `password_hash` | Hashed password |
| `signature_image_path` | Uploaded signature path |
| `is_active` | Account active status |
| `created_at` | Account creation time |

### `gate_passes`

Stores gate-pass requests.

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

These models exist in the backend codebase for chat persistence, but the current API implementation exposes only the main `/api/v1/chat` endpoint.

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
admin_signature.png
checker_signature.png
```

The generated PDF includes student information, leave details, approval details, and signature boxes.

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

### Frontend

```bash
cd frontend
npm install
npm run dev
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
- Upload directories are writable.
- Signature assets exist if required for PDF rendering.

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
- Use a strong JWT secret.
- Restrict CORS to trusted frontend domains.
- Use HTTPS.
- Disable development reload mode.
- Validate uploaded files carefully.
- Add upload file-size limits.
- Restrict admin registration.
- Use proper database migrations, such as Alembic.
- Store SMTP credentials securely.
- Use a transactional email provider for production.
- Protect generated PDF download routes.
- Back up PostgreSQL data.
- Back up uploaded signatures and generated PDFs.
- Review authorization checks for all admin routes.

---

## Known Limitations

- The system currently uses startup-based table creation instead of formal migrations.
- Existing database schemas may require manual updates when models change.
- The AI assistant is retrieval-based, not a generative LLM.
- Chatbot answer quality depends on the hall-rule dataset.
- Vector model loading can increase backend startup time.
- SMTP delivery depends on external email-provider configuration.
- Generated PDFs and uploads are served from local static storage in development.
- Chat session models exist, but the current API exposes only the main chat endpoint.
- Production deployment requires additional hardening.

---

## Future Improvements

- Alembic database migrations
- Protected admin registration
- Dedicated admin seeding command
- Password reset flow
- Email verification
- Gate-pass QR code verification
- Protected PDF download endpoint
- Gate-pass download history
- Complaint priority levels
- Complaint comments or admin notes
- Chat session API endpoints
- Persistent user-specific chatbot history
- Real-time notifications with WebSocket
- Notification deep links
- Notification delivery tracking
- Email retry queue with Celery or RQ
- Admin analytics dashboard
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
https://github.com/mehedi77k/DIU-Hall-AI-Assistant
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
```