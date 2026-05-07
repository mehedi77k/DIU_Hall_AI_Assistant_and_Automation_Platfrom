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

## Overview

**DIU Hall AI Assistant & Automation Platform** is a web-based system designed to simplify and automate student hall-management workflows.

The system allows students to register, log in, manage their profile, upload a signature, submit gate-pass requests, view notices, submit complaints, receive in-app and email notifications, and ask hall-rule-related questions through an AI assistant.

Administrators can review and approve or reject gate-pass requests, generate gate-pass PDFs, publish notices, manage complaints, update complaint status, manage hall rules, rebuild the chatbot vector index, and trigger notification workflows for important hall updates.

The project uses a **React + Vite frontend**, a **FastAPI backend**, a **PostgreSQL database**, and a **ChromaDB vector store** powered by **Sentence Transformers** for semantic hall-rule retrieval.

---

## Latest Updates

This version includes several important new features and security/UX improvements:

- User-specific chatbot history stored in the database
- Chatbot history isolation by logged-in user
- Fresh new chat screen every time the chatbot page is opened
- Previous chats shown under recent chats
- Persistent chat sessions and chat messages
- Chat session rename and delete support
- Student signature required before submitting a gate-pass request
- Admin signature required before approving or rejecting gate-pass requests
- Dynamic admin signature in generated gate-pass PDFs
- Gate-pass PDF uses the approving admin's uploaded profile signature
- Professional notification email templates
- Gate-pass approval email includes PDF download link
- Notification deep-link support
- Bell notification click redirects to the related page
- New hall-rule email notification to all active admins and students
- Notice notifications include in-app notification and optional email
- Complaint status notifications include in-app notification and optional email
- Docker backend healthcheck support
- Frontend waits for backend health before startup
- HuggingFace and Torch cache volumes for faster backend startup

---

## Key Features

### Authentication and Authorization

- Student and admin registration
- Student and admin login
- JWT-based authentication
- Protected backend API routes
- Role-based route protection in frontend
- Admin-only rule management
- Admin-only gate-pass approval/rejection
- Admin-only notice publishing
- Admin-only complaint status update

### Profile and Signature

- User profile page
- Signature image upload
- Supports `.png`, `.jpg`, `.jpeg`
- Signature stored under backend uploads
- Student signature is mandatory before gate-pass submission
- Admin signature is mandatory before gate-pass approval or rejection
- Admin's own uploaded signature appears in the generated gate-pass PDF

### Gate-Pass System

- Student gate-pass request submission
- Student can view only their own gate-pass requests
- Admin can view all gate-pass requests
- Admin can approve gate-pass requests
- Admin can reject gate-pass requests
- Automated gate-pass PDF generation using ReportLab
- PDF includes:
  - Gate-pass number
  - Student information
  - Leave and return dates
  - Guardian phone
  - Reason
  - Item/details
  - Approval information
  - Student signature
  - Approving admin signature
  - Checker signature
- Gate-pass approval notification
- Gate-pass rejection notification
- Gate-pass approval email includes PDF link

### Notice Board

- Admin can publish notices
- Students can view notices
- Notice can include deadline
- Notice creation triggers notifications to active students
- Notice email template includes notice title, content, and notice-board link

### Complaint Management

- Student complaint submission
- Student can view own complaints
- Admin can view all complaints
- Admin can update complaint status
- Supported status values:
  - `accepted`
  - `rejected`
- Complaint status update triggers in-app and email notifications

### Notification System

- In-app notification bell
- Unread notification badge
- Notification list dropdown
- Mark one notification as read
- Mark all notifications as read
- Notification categories:
  - `gate_pass`
  - `notice`
  - `complaint`
  - `hall_rule`
- Notification deep-link support
- Notification click can redirect to:
  - Gate-pass page
  - Notice board
  - Complaint page
  - Chatbot page
- Optional SMTP email notification support
- Professional email templates
- Background email sending through FastAPI `BackgroundTasks`

### Hall Rule Management

- Admin can create hall rules
- Admin can update hall rules
- Admin can delete hall rules
- Admin can rebuild vector index
- Duplicate active rule number validation
- Inactive rule can be restored by adding the same rule number
- Rule updates sync with ChromaDB vector index
- Rule deletion removes rule from vector index
- New rule creation sends notifications to all active admins and students

### AI Hall-Rules Chatbot

- Hall-rule question answering
- Exact rule-number lookup
- Semantic rule retrieval
- Uses Sentence Transformers for embeddings
- Uses ChromaDB for vector search
- Returns matched rule sources
- Authenticated chatbot API
- User-specific chat history
- Database-backed chat sessions
- Database-backed chat messages
- Previous chats remain under recent chats
- Opening chatbot page starts from a fresh new chat screen
- Admin and student chat histories are separated by account

### Docker and Startup Reliability

- Docker Compose based setup
- PostgreSQL healthcheck
- Backend healthcheck
- Frontend waits for backend to become healthy
- Backend runs without `--reload` in Docker for better startup stability
- HuggingFace cache volume
- Torch cache volume
- Persistent uploads volume
- PostgreSQL data volume

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                             User Layer                              │
│                                                                     │
│  ┌─────────────────────┐        ┌─────────────────────┐             │
│  │      Student        │        │        Admin        │             │
│  │                     │        │                     │             │
│  │ - Register/Login    │        │ - Manage notices    │             │
│  │ - Upload signature  │        │ - Manage complaints │             │
│  │ - Request gate pass │        │ - Approve passes    │             │
│  │ - Submit complaint  │        │ - Manage rules      │             │
│  │ - Receive alerts    │        │ - Rebuild index     │             │
│  │ - Ask chatbot       │        │ - Receive alerts    │             │
│  └──────────┬──────────┘        └──────────┬──────────┘             │
└─────────────┼──────────────────────────────┼────────────────────────┘
              │                              │
              │ Browser Requests             │ Browser Requests
              ▼                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                              │
│                                                                     │
│                  React + Vite Single Page App                       │
│                                                                     │
│  Pages:                                                             │
│  - Login / Register                                                 │
│  - Dashboard                                                        │
│  - Profile                                                          │
│  - Gate Pass                                                        │
│  - Notice Board                                                     │
│  - Complaints                                                       │
│  - Chatbot                                                          │
│  - Admin Rule Management                                            │
│                                                                     │
│  Components:                                                        │
│  - Notification Bell                                                │
│  - Role-based Sidebar                                               │
│  - Protected Routes                                                 │
│                                                                     │
│  Responsibilities:                                                  │
│  - User interface                                                   │
│  - Token storage                                                    │
│  - Role-based navigation                                            │
│  - API communication                                                │
│  - Notification display                                             │
│  - Chat history UI                                                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ REST API over HTTP
                                │ JWT Bearer Token
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Backend Layer                              │
│                                                                     │
│                          FastAPI Server                             │
│                                                                     │
│  Core Modules:                                                      │
│  - Authentication                                                   │
│  - User profile and signature upload                                │
│  - Gate-pass request management                                     │
│  - Gate-pass PDF generation                                         │
│  - Notice management                                                │
│  - Notification management                                          │
│  - Complaint management                                             │
│  - Hall-rule management                                             │
│  - Chat session management                                          │
│  - AI chatbot API                                                   │
│                                                                     │
│  Backend Services:                                                  │
│  - Password hashing                                                 │
│  - JWT creation and validation                                      │
│  - Role-based authorization                                         │
│  - SMTP email notification                                          │
│  - Static file serving                                              │
│  - PDF generation using ReportLab                                   │
│  - ChromaDB vector indexing                                         │
└───────────────┬───────────────────────────────┬─────────────────────┘
                │                               │
                │ SQLAlchemy ORM                │ File Storage
                ▼                               ▼
┌──────────────────────────────┐     ┌───────────────────────────────┐
│        Database Layer        |     │       Uploads / Assets        | 
│                              │     │                               │
│        PostgreSQL            |     │ - User signatures             | 
│                              │     │ - Generated gate-pass PDFs    |  
│  Tables:                     |     │ - Checker signature asset     |  
│  - users                     |     │                               │
│  - gate_passes               |     └───────────────────────────────┘
│  - notices                   |
│  - complaints                |
│  - notifications             |
│  - hall_rules                |
│  - chat_sessions             |
│  - chat_messages             |
└───────────────┬──────────────┘
                │
                │ Hall rules are seeded and indexed
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         AI / RAG Layer                              │
│                                                                     │
│  Hall Rules JSON Dataset                                            │
│          │                                                          │
│          ▼                                                          │
│  PostgreSQL hall_rules Table                                        │
│          │                                                          │
│          ▼                                                          │
│  Sentence Transformer Embedding Model                               │
│          │                                                          │
│          ▼                                                          │
│  ChromaDB Persistent Vector Store                                   │
│          │                                                          │
│          ▼                                                          │
│  Semantic Rule Retrieval + Exact Rule Lookup                        │
│          │                                                          │
│          ▼                                                          │
│  Chatbot Answer Returned to Frontend                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Application Workflow

### Student Workflow

```text
Student
  │
  ├── Register / Login
  │
  ├── Upload Signature
  │       └── Required before gate-pass submission
  │
  ├── Submit Gate-Pass Request
  │       │
  │       └── Wait for Admin Approval or Rejection
  │
  ├── Receive Gate-Pass Notification
  │       ├── In-app notification
  │       └── Optional email notification
  │
  ├── View Notices
  │
  ├── Submit Complaint
  │
  ├── Receive Complaint Status Notification
  │
  ├── Receive New Rule Notification
  │
  └── Ask Hall-Rule Questions through Chatbot
```

### Admin Workflow

```text
Admin
  │
  ├── Login
  │
  ├── Upload Signature
  │       └── Required before gate-pass approval/rejection
  │
  ├── View All Gate-Pass Requests
  │       │
  │       ├── Approve Request
  │       │       ├── Generate Gate-Pass PDF
  │       │       ├── Add Admin Signature to PDF
  │       │       └── Notify Student
  │       │
  │       └── Reject Request
  │               └── Notify Student
  │
  ├── Publish Notices
  │       └── Notify Students
  │
  ├── View Complaints
  │       └── Update Complaint Status
  │               └── Notify Student
  │
  ├── Manage Hall Rules
  │       │
  │       ├── Create Rule
  │       │       └── Notify All Active Admins and Students
  │       ├── Update Rule
  │       ├── Delete Rule
  │       └── Rebuild Vector Index
  │
  └── Test Email Notification in Development
```

### Chatbot Workflow

```text
User Opens Chatbot Page
   │
   ├── Fresh empty chat screen is shown
   │
   ├── Previous chats are listed under Recents
   │
   └── User asks a question
           │
           ▼
     Authenticated Chat API
           │
           ▼
     Create or use Chat Session
           │
           ▼
     Save User Message
           │
           ▼
     Retrieve Matching Hall Rules
           │
           ├── Exact Rule Lookup
           │
           └── Semantic Vector Search
           │
           ▼
     Generate Answer
           │
           ▼
     Save Assistant Message
           │
           ▼
     Return Answer + Matched Rules
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router |
| Backend | Python, FastAPI, Uvicorn |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT, password hashing |
| Validation | Pydantic |
| AI Retrieval | Sentence Transformers, ChromaDB |
| PDF Generation | ReportLab |
| Email | SMTP |
| Containerization | Docker, Docker Compose |
| Static Files | FastAPI StaticFiles |
| Development Server | Vite, Uvicorn |

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
│   ├── package.json
│   └── package-lock.json
│
├── docker-compose.yml
├── .env
└── README.md
```

---

## Database Design

### `users`

Stores student and admin account information.

| Field | Description |
|---|---|
| `id` | Primary key |
| `full_name` | User full name |
| `student_id` | Student or admin ID |
| `email` | Unique email address |
| `phone` | Optional phone number |
| `role` | `student` or `admin` |
| `password_hash` | Hashed password |
| `signature_image_path` | Uploaded signature path |
| `is_active` | Account active status |
| `created_at` | Account creation time |

### `gate_passes`

Stores gate-pass requests and approval information.

| Field | Description |
|---|---|
| `id` | Primary key |
| `student_name` | Student name |
| `student_id` | Student ID |
| `room_no` | Hall room number |
| `leave_date` | Leaving date |
| `return_date` | Return date |
| `guardian_phone` | Guardian phone number |
| `reason` | Reason for leaving |
| `item_list` | Items or details |
| `status` | `pending`, `approved`, or `rejected` |
| `approved_by` | Admin who approved the request |
| `pdf_path` | Generated gate-pass PDF path |
| `created_at` | Request creation time |

### `notices`

Stores hall notices created by admins.

| Field | Description |
|---|---|
| `id` | Primary key |
| `title` | Notice title |
| `content` | Notice body |
| `deadline` | Optional deadline |
| `posted_by` | Admin name |
| `created_at` | Notice publish time |

### `complaints`

Stores student complaints.

| Field | Description |
|---|---|
| `id` | Primary key |
| `student_name` | Student name |
| `student_id` | Student ID |
| `room_no` | Hall room number |
| `category` | Complaint category |
| `description` | Complaint details |
| `status` | Complaint status |
| `created_at` | Submission time |

### `notifications`

Stores in-app notifications and deep-link metadata.

| Field | Description |
|---|---|
| `id` | Primary key |
| `recipient_user_id` | Notification receiver |
| `title` | Notification title |
| `message` | Notification message |
| `category` | Notification category |
| `is_read` | Read/unread status |
| `entity_type` | Related entity type, such as `gate_pass`, `notice`, `complaint`, or `hall_rule` |
| `entity_id` | Related entity ID |
| `action_url` | Frontend path to open when notification is clicked |
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

### `chat_sessions`

Stores chatbot sessions for each authenticated user.

| Field | Description |
|---|---|
| `id` | Primary key |
| `user_id` | Chat owner |
| `title` | Chat session title |
| `created_at` | Session creation time |
| `updated_at` | Last activity time |

### `chat_messages`

Stores chatbot messages.

| Field | Description |
|---|---|
| `id` | Primary key |
| `session_id` | Related chat session |
| `role` | `user` or `assistant` |
| `text` | Message text |
| `matched_rules_json` | Matched rule metadata for assistant responses |
| `created_at` | Message creation time |

---

## Prerequisites

Before running the project, install:

- Git
- Docker
- Docker Compose
- Node.js 20+ if running the frontend manually
- Python 3.12+ if running the backend manually
- PostgreSQL if running without Docker

---

## Running the Project with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/mehedi77k/DIU-Hall-AI-Assistant.git
cd DIU-Hall-AI-Assistant
```

### 2. Create or Update Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL=postgresql+psycopg://diu_user:diu_password@db:5432/diu_hall

APP_NAME=DIU Hall AI Assistant and Automation Platform
APP_ENV=development

BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]

EMAIL_NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_sender_email@gmail.com
SMTP_PASSWORD=your_16_character_app_password_without_spaces
SMTP_FROM_EMAIL=your_sender_email@gmail.com
SMTP_USE_TLS=true

PUBLIC_BACKEND_URL=http://localhost:8000
PUBLIC_FRONTEND_URL=http://localhost:5173

BACKEND_PORT=8000
FRONTEND_PORT=5173
DB_PORT=55432
```

If you do not want email notifications during development:

```env
EMAIL_NOTIFICATIONS_ENABLED=false
```

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

Backend Swagger Documentation:

```text
http://localhost:8000/docs
```

PostgreSQL inside Docker is exposed on:

```text
localhost:55432
```

Default Docker database configuration:

```text
Database: diu_hall
User: diu_user
Password: diu_password
Host: localhost
Port: 55432
```

---

## Docker Compose Notes

The recommended Docker setup includes:

- PostgreSQL healthcheck
- Backend healthcheck
- Frontend waits for backend health
- No backend `--reload` in Docker command
- Persistent PostgreSQL volume
- Persistent uploads volume
- HuggingFace cache volume
- Torch cache volume

Recommended backend command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Recommended backend healthcheck:

```yaml
healthcheck:
  test:
    [
      "CMD",
      "python",
      "-c",
      "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health', timeout=3)"
    ]
  interval: 10s
  timeout: 5s
  retries: 30
  start_period: 90s
```

Recommended frontend dependency:

```yaml
depends_on:
  backend:
    condition: service_healthy
```

This prevents the frontend from starting before the backend is fully ready.

---

## Running the Project Manually

Use this method if you do not want to use Docker.

### 1. Clone the Repository

```bash
git clone https://github.com/mehedi77k/DIU-Hall-AI-Assistant.git
cd DIU-Hall-AI-Assistant
```

### 2. Start PostgreSQL

Create a PostgreSQL database:

```sql
CREATE DATABASE diu_hall;
CREATE USER diu_user WITH PASSWORD 'diu_password';
GRANT ALL PRIVILEGES ON DATABASE diu_hall TO diu_user;
```

### 3. Configure Backend Environment

Create a `.env` file inside the project root or backend folder depending on how you run the backend.

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

ANONYMIZED_TELEMETRY=False
```

### 4. Install Backend Dependencies

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

For Windows:

```bash
.venv\Scripts\activate
```

For Linux or macOS:

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

Backend will run at:

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

Frontend will run at:

```text
http://localhost:5173
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `APP_NAME` | Backend application name | `DIU Hall AI Assistant and Automation Platform` |
| `APP_ENV` | Runtime environment | `development` |
| `DATABASE_URL` | SQLAlchemy database connection URL | `postgresql+psycopg://diu_user:diu_password@db:5432/diu_hall` |
| `BACKEND_CORS_ORIGINS` | Allowed frontend origins | `["http://localhost:5173","http://127.0.0.1:5173"]` |
| `EMAIL_NOTIFICATIONS_ENABLED` | Enable or disable SMTP emails | `true` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USERNAME` | SMTP username | `example@gmail.com` |
| `SMTP_PASSWORD` | SMTP app password | `your_app_password` |
| `SMTP_FROM_EMAIL` | Sender email address | `example@gmail.com` |
| `SMTP_USE_TLS` | Enable TLS for SMTP | `true` |
| `PUBLIC_BACKEND_URL` | Public backend URL used in email links | `http://localhost:8000` |
| `PUBLIC_FRONTEND_URL` | Public frontend URL used in email links | `http://localhost:5173` |
| `BACKEND_PORT` | Backend host port | `8000` |
| `FRONTEND_PORT` | Frontend host port | `5173` |
| `DB_PORT` | PostgreSQL host port | `55432` |
| `ANONYMIZED_TELEMETRY` | Disable Chroma telemetry | `False` |

---

## Email Notification Setup

The platform can send email notifications for:

- Gate-pass approval
- Gate-pass rejection
- Notice publishing
- Complaint status update
- New hall-rule creation
- Development email test

### Gmail SMTP Setup

If Gmail is used as the SMTP sender:

1. Use a dedicated sender Gmail account.
2. Enable 2-Step Verification.
3. Generate a Gmail App Password.
4. Put the 16-character app password in `.env` without spaces.
5. Set `SMTP_USERNAME` and `SMTP_FROM_EMAIL` to the same Gmail address.

Example:

```env
EMAIL_NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=diuhallassistant@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM_EMAIL=diuhallassistant@gmail.com
SMTP_USE_TLS=true
```

Do not use a normal Gmail password.

### Email Testing

Admin can test email using:

```text
POST /api/v1/dev/test-email
```

Example request:

```json
{
  "to_email": "student@example.com"
}
```

Check email logs:

```bash
docker compose logs backend --tail=200
```

Search only email logs in PowerShell:

```powershell
docker compose logs backend --tail=200 | Select-String "Email"
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
| `GET` | `/` | Backend root message |
| `GET` | `/api/v1/health` | Health check |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a student or admin user |
| `POST` | `/api/v1/auth/login` | Login and receive JWT access token |
| `GET` | `/api/v1/auth/me` | Get current authenticated user |

### User Profile

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/users/me/signature` | Upload current user's signature image |

Supported signature formats:

```text
.png
.jpg
.jpeg
```

### Gate Pass

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/gate-passes` | Student/Admin | List gate passes |
| `POST` | `/api/v1/gate-passes` | Student | Submit gate-pass request |
| `POST` | `/api/v1/gate-passes/{gate_pass_id}/approve` | Admin | Approve request and generate PDF |
| `POST` | `/api/v1/gate-passes/{gate_pass_id}/reject` | Admin | Reject request |

### Notices

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/notices` | Public/Auth UI | List notices |
| `POST` | `/api/v1/notices` | Admin | Create notice and notify students |

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
| `POST` | `/api/v1/complaints` | Student | Submit complaint |
| `POST` | `/api/v1/complaints/{complaint_id}/status` | Admin | Update complaint status |

Supported complaint status update values:

```text
accepted
rejected
```

### Chatbot

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/chat/sessions` | Authenticated | List current user's chat sessions |
| `POST` | `/api/v1/chat/sessions` | Authenticated | Create a chat session |
| `PATCH` | `/api/v1/chat/sessions/{session_id}` | Authenticated | Rename a chat session |
| `DELETE` | `/api/v1/chat/sessions/{session_id}` | Authenticated | Delete a chat session |
| `GET` | `/api/v1/chat/sessions/{session_id}/messages` | Authenticated | List messages in a chat session |
| `POST` | `/api/v1/chat` | Authenticated | Ask hall-rule-related questions |

Example request:

```json
{
  "session_id": 1,
  "message": "What is rule 5?"
}
```

Example response:

```json
{
  "session_id": 1,
  "answer": "According to Rule 5 under ...",
  "matched_rules": [
    {
      "id": "rule_5",
      "rule_number": 5,
      "section": "Section Name",
      "page": 1,
      "text": "Rule text"
    }
  ]
}
```

### Hall Rule Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/rules` | Admin | List hall rules |
| `POST` | `/api/v1/admin/rules` | Admin | Create hall rule and notify all active admins/students |
| `PUT` | `/api/v1/admin/rules/{rule_id}` | Admin | Update hall rule |
| `DELETE` | `/api/v1/admin/rules/{rule_id}` | Admin | Delete hall rule |
| `POST` | `/api/v1/admin/rules/rebuild-index` | Admin | Rebuild ChromaDB vector index |

### Development Email Test

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/dev/test-email` | Admin | Send test email in development mode |

Example request:

```json
{
  "to_email": "student@example.com"
}
```

---

## Authentication and Authorization

The system uses JWT-based authentication.

After login, the backend returns:

```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "full_name": "Student Name",
    "student_id": "12345",
    "email": "student@example.com",
    "role": "student"
  }
}
```

Protected requests must include:

```http
Authorization: Bearer jwt_token_here
```

### Roles

| Role | Capabilities |
|---|---|
| `student` | Submit gate passes, submit complaints, view notices, use chatbot, receive notifications |
| `admin` | Manage gate passes, notices, complaints, hall rules, test email notifications, and receive admin notifications |

---

## Signature Policy

### Student Signature

A student must upload a signature before submitting a gate-pass request.

If a student tries to submit a gate pass without a signature, the API returns an error.

### Admin Signature

An admin must upload a signature before approving or rejecting a gate-pass request.

If an admin tries to approve or reject without a signature, the API returns an error.

### PDF Signature Behavior

When a gate pass is approved:

- The student signature is taken from the student's uploaded profile signature.
- The admin signature is taken from the approving admin's uploaded profile signature.
- The checker signature is taken from the configured checker signature asset.

---

## Gate-Pass PDF Generation

When an admin approves a gate-pass request, the backend generates a PDF using ReportLab.

The generated PDF includes:

- Gate-pass number
- Student name
- Student ID
- Room number
- Guardian phone number
- Leave date
- Return date
- Reason
- Item/details section
- Approval information
- Student signature
- Approving admin signature
- Checker signature

Generated PDFs are stored under:

```text
backend/uploads/gate_pass_pdfs
```

User signatures are stored under:

```text
backend/uploads/signatures/students
```

---

## Notification Behavior

### Gate-Pass Approved

Receiver:

```text
The student who submitted the gate-pass request
```

In-app notification:

```text
Gate pass GP-0001 has been approved.
```

Email subject:

```text
Gate Pass Approved - GP-0001
```

Email contains:

- Student name
- Gate-pass ID
- Student ID
- Room number
- Leave date
- Return date
- Approving admin name
- Approval time
- PDF download link
- Gate-pass page link

### Gate-Pass Rejected

Receiver:

```text
The student who submitted the gate-pass request
```

Email subject:

```text
Gate Pass Rejected - GP-0001
```

### Notice Created

Receiver:

```text
All active students
```

Email subject:

```text
New Hall Notice - Notice Title
```

### Complaint Status Updated

Receiver:

```text
The student who submitted the complaint
```

Email subject:

```text
Complaint Status Updated - #1
```

### New Hall Rule Added

Receiver:

```text
All active students and admins
```

Email subject:

```text
New Hall Rule Added - Rule 12
```

Email contains:

- Rule number
- Section
- Page number
- Admin who added the rule
- Added time
- Rule text
- Chatbot link
- Admin rule-management link for admin receivers

---

## Hall Rule Seeding and Vector Indexing

On backend startup, the system seeds hall rules from:

```text
backend/app/data/processed/chunks_updated.json
```

The rules are inserted into the `hall_rules` table if they do not already exist.

Each active hall rule is converted into an embedding using:

```text
all-MiniLM-L6-v2
```

The embeddings are stored in ChromaDB under:

```text
backend/app/data/vectordb
```

The vector collection name is:

```text
hostel_rules
```

---

## AI Assistant Behavior

The chatbot supports two retrieval modes.

### 1. Exact Rule Lookup

If the user asks for a specific rule number, the system searches the database directly.

Example:

```text
What is rule 7?
```

The backend detects `rule 7` and returns that exact active rule if available.

### 2. Semantic Search

If no exact rule number is detected, the question is embedded and compared against the ChromaDB vector store.

Example:

```text
Can I leave the hall at night?
```

The system retrieves the most semantically relevant hall rules and returns a formatted answer with matched rules.

### 3. User-Specific Chat History

Each user has separate chatbot history.

Behavior:

- Student A cannot see Student B's chats.
- Admin cannot see Student chats.
- Student cannot see Admin chats.
- Chat sessions are filtered by `current_user.id`.
- Messages are stored in `chat_messages`.
- Sessions are stored in `chat_sessions`.
- A fresh empty chat opens when visiting the chatbot page.
- Old chats are shown under Recents.

---

## Frontend Pages

| Page | Description |
|---|---|
| Login | User login page |
| Register | User registration page |
| Dashboard | Main dashboard after login |
| Profile | User profile and signature upload |
| Gate Pass | Submit and manage gate-pass requests |
| Notice Board | View hall notices |
| Complaints | Submit and track complaints |
| Chatbot | Ask hall-rule questions and view recent chats |
| Admin Rules | Admin-only hall-rule management |

---

## Docker Services

The project defines three Docker services.

| Service | Description | Port |
|---|---|---|
| `db` | PostgreSQL database | `55432:5432` |
| `backend` | FastAPI backend | `8000:8000` |
| `frontend` | React/Vite frontend | `5173:5173` |

Start all services:

```bash
docker compose up --build
```

Stop all services:

```bash
docker compose down
```

Stop and remove database volume:

```bash
docker compose down -v
```

View logs:

```bash
docker compose logs -f
```

View backend logs only:

```bash
docker compose logs -f backend
```

View frontend logs only:

```bash
docker compose logs -f frontend
```

Check service status:

```bash
docker compose ps
```

---

## Testing Checklist

Use this checklist before demonstration or deployment.

### Backend

- [ ] Backend starts without errors
- [ ] `/api/v1/health` returns a successful response
- [ ] PostgreSQL container is healthy
- [ ] Backend container becomes healthy
- [ ] Frontend starts after backend healthcheck passes
- [ ] Database tables are created
- [ ] Hall rules are seeded from JSON
- [ ] ChromaDB vector store is created
- [ ] Swagger docs open at `/docs`
- [ ] CORS allows the frontend origin

### Authentication

- [ ] Student can register
- [ ] Admin can register or exists in the database
- [ ] User can log in
- [ ] JWT token is returned after login
- [ ] Protected routes reject unauthenticated requests
- [ ] Admin routes reject non-admin users

### Student Features

- [ ] Student can upload signature
- [ ] Student cannot submit gate pass without signature
- [ ] Student can submit gate-pass request after signature upload
- [ ] Student can view own gate-pass requests
- [ ] Student can view notices
- [ ] Student can submit complaints
- [ ] Student can view notifications
- [ ] Student notification click redirects to related page
- [ ] Student can ask chatbot questions
- [ ] Student chatbot history is private

### Admin Features

- [ ] Admin can upload signature
- [ ] Admin cannot approve gate pass without signature
- [ ] Admin cannot reject gate pass without signature
- [ ] Admin can view all gate-pass requests
- [ ] Admin can approve gate-pass requests
- [ ] Approved gate-pass PDF is generated
- [ ] PDF includes the approving admin's signature
- [ ] Admin can reject gate-pass requests
- [ ] Admin can publish notices
- [ ] Notice notifications are created
- [ ] Admin can view complaints
- [ ] Admin can update complaint status
- [ ] Admin can create hall rules
- [ ] New rule sends notification to active admins and students
- [ ] Admin can update hall rules
- [ ] Admin can delete hall rules
- [ ] Admin can rebuild vector index

### Notification Features

- [ ] Gate-pass approval creates in-app notification
- [ ] Gate-pass approval sends email if SMTP is enabled
- [ ] Gate-pass rejection creates notification
- [ ] Notice creation creates notifications
- [ ] Complaint status update creates notification
- [ ] New hall-rule creation notifies all active students and admins
- [ ] Notification deep links work
- [ ] Mark one notification as read works
- [ ] Mark all notifications as read works

### Frontend

- [ ] Frontend opens at `http://localhost:5173`
- [ ] Login page works
- [ ] Register page works
- [ ] Navigation changes based on login status
- [ ] Admin-only route is hidden from students
- [ ] Logout clears stored user data
- [ ] Notification bell displays unread notifications
- [ ] Chatbot opens with a fresh empty chat
- [ ] Previous chatbot sessions appear under Recents

---

## Troubleshooting

### Docker Build Is Slow

The backend installs PyTorch, Transformers, Sentence Transformers, and ChromaDB. The first build may take time.

Recommended actions:

```bash
docker compose build backend
docker compose up
```

Persistent cache volumes can reduce repeated model-loading delays:

```text
hf_cache
torch_cache
```

### Backend Shows Running but Login Fails Temporarily

Docker may show a container as running before the FastAPI application is fully ready.

Fix:

- Add backend healthcheck
- Remove backend `--reload` in Docker
- Make frontend depend on backend `service_healthy`

Check backend health manually:

```text
http://localhost:8000/api/v1/health
```

### Backend Cannot Connect to Database

Check that the database container is running:

```bash
docker compose ps
```

Check database logs:

```bash
docker compose logs db
```

Confirm that `DATABASE_URL` points to the Docker service name when running inside Docker:

```text
postgresql+psycopg://diu_user:diu_password@db:5432/diu_hall
```

For manual local runs, use:

```text
postgresql+psycopg://diu_user:diu_password@localhost:5432/diu_hall
```

### Frontend Cannot Connect to Backend

Check that the backend is running:

```text
http://localhost:8000/api/v1/health
```

Check that CORS includes the frontend origin:

```env
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

### Chatbot Returns No Relevant Answer

Check that:

- Hall rules exist in the database.
- `chunks_updated.json` exists.
- The vector database has been built.
- Admin has rebuilt the vector index if rules were changed.
- The question is related to hall rules.

### Chatbot History Is Not Showing

Check that:

- User is logged in.
- JWT token exists.
- `/api/v1/chat/sessions` returns sessions.
- `/api/v1/chat/sessions/{session_id}/messages` returns messages.
- Chat sessions belong to the current user.

### Gate-Pass Submission Fails

Check that:

- The current user is a student.
- The student has uploaded a signature.
- Required gate-pass fields are filled.

### Gate-Pass Approval Fails

Check that:

- The current user is an admin.
- The admin has uploaded a signature.
- The student has uploaded a signature.
- The gate-pass request exists.
- Upload folders are writable.

### Email Notifications Are Not Sent

Check that:

- `EMAIL_NOTIFICATIONS_ENABLED=true`
- SMTP host, port, username, password, and sender email are configured
- `SMTP_USERNAME` and `SMTP_FROM_EMAIL` belong to the same sender account
- Gmail uses a valid App Password, not the normal Gmail password
- The recipient user has a valid email address
- Backend logs do not show SMTP errors

Check email logs:

```bash
docker compose logs backend --tail=200
```

PowerShell filter:

```powershell
docker compose logs backend --tail=200 | Select-String "Email"
```

Common Gmail SMTP error:

```text
535 5.7.8 Username and Password not accepted
```

This usually means the SMTP username/password is wrong or a Gmail App Password was not used.

### Notification Deep Links Do Not Work

Check that:

- `notifications.action_url` exists in the database.
- `NotificationResponse` includes `action_url`.
- `NotificationBell.jsx` uses `useNavigate`.
- Notification click handler calls `navigate(notification.action_url)`.

---

## Security Notes

Before using this project in production, review the following:

- Do not commit real `.env` files or credentials.
- Use a strong JWT secret.
- Restrict CORS to trusted frontend domains.
- Disable development reload mode in production.
- Use HTTPS in production.
- Validate uploaded files carefully.
- Add file-size limits for uploads.
- Use proper database migrations such as Alembic.
- Restrict admin account creation.
- Store SMTP credentials securely.
- Use a transactional email provider for production.
- Review role-based authorization for every admin route.
- Protect generated PDF download routes in production.
- Back up the PostgreSQL database regularly.
- Back up uploaded signatures and generated PDFs.

---

## Known Limitations

- The system currently uses startup-based table creation instead of a formal migration workflow.
- Existing database tables require manual SQL changes when new columns are added.
- The AI assistant is retrieval-based, not a generative LLM.
- Chatbot answers depend on the quality and completeness of the hall-rule dataset.
- The vector model loads inside the backend service, which can increase startup time.
- SMTP email delivery depends on external email-provider configuration.
- Generated PDFs are served from static uploads in the development setup.
- Production deployment requires additional hardening.

---

## Possible Future Enhancements

- Alembic database migrations
- Dedicated admin-user seeding command
- Stronger admin registration protection
- Password reset flow
- Email verification
- Gate-pass QR code verification
- Protected PDF download endpoint
- PDF download history
- Complaint priority levels
- Complaint comments or admin notes
- Real-time notifications using WebSocket
- Notification delivery status tracking
- Email retry queue using Celery or RQ
- Admin notification dashboard
- Dashboard analytics
- Hall occupancy management
- Room allocation module
- Visitor management module
- Export reports as CSV or PDF
- Cloud deployment configuration
- CI/CD workflow with GitHub Actions
- Automated backend and frontend tests
- Improved chatbot confidence scoring
- Source citation display for chatbot answers
- Multi-language chatbot support
- HTML email templates
- Notification preferences per user

---

## Development Commands

### Backend

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm run dev
```

### Docker

```bash
docker compose up --build
```

### Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Build Frontend

```bash
cd frontend
npm run build
```

### Preview Frontend Build

```bash
cd frontend
npm run preview
```

---

## Recommended Production Deployment

For production deployment:

1. Use a managed PostgreSQL database or secured self-hosted PostgreSQL instance.
2. Replace development secrets with secure environment variables.
3. Disable `--reload` in the backend Docker command.
4. Build the React frontend into static assets.
5. Serve frontend assets through Nginx or another production web server.
6. Run FastAPI with a production ASGI setup.
7. Enable HTTPS.
8. Restrict CORS.
9. Add logging and monitoring.
10. Add automated backups for PostgreSQL and uploaded files.
11. Use Alembic migrations.
12. Use a transactional email service.
13. Protect generated PDF download routes.
14. Use cloud object storage for uploaded signatures and PDFs.

Example production backend command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

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
Chat History: User-specific PostgreSQL-backed sessions
```

---

## Support

For issues, suggestions, or improvements, open an issue in the GitHub repository:

```text
https://github.com/mehedi77k/DIU-Hall-AI-Assistant/issues
```

---
