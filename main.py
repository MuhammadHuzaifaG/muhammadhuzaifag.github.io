"""
=============================================================================
DEV ANALYTICS PLATFORM 
=============================================================================
"""

import os
import time
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv
from groq import Groq

# ---------------------------------------------------------------------------
# 1. ENVIRONMENT & GROQ CLIENT INITIALIZATION
# ---------------------------------------------------------------------------
# Load variables from .env file (for local development)
load_dotenv()

# Read Groq API key from environment (.env locally or Render Environment Variables)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

app = FastAPI(
    title="Dev Analytics Engine API (Groq AI Powered)",
    description="Backend API powering live KPI metrics, SQL sandbox, and Groq LLM Chatbot.",
    version="1.1.0"
)

# Enable CORS for GitHub Pages frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# 2. PYDANTIC DATA SCHEMAS
# ---------------------------------------------------------------------------
class SQLQueryRequest(BaseModel):
    query: str = Field(..., example="SELECT * FROM ecommerce_sales LIMIT 5;")
    limit: Optional[int] = Field(default=50, ge=1, le=500)

class SQLQueryResponse(BaseModel):
    status: str
    execution_time_ms: float
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int

class ChatMessage(BaseModel):
    role: str = Field(..., example="user")
    content: str = Field(..., example="What are Huzaifa's primary skills?")

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ConsultationRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    service_category: str = Field(..., example="Full-Stack Web Development")
    budget_range: str = Field(..., example="$1,000 - $3,000")
    project_details: str = Field(..., min_length=10, max_length=2000)


# ---------------------------------------------------------------------------
# 3. IN-MEMORY SANDBOX DATABASE
# ---------------------------------------------------------------------------
def init_sandbox_db():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE ecommerce_sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_name TEXT NOT NULL,
            category TEXT NOT NULL,
            revenue REAL NOT NULL,
            created_at DATE NOT NULL
        )
    """)
    cursor.executemany("""
        INSERT INTO ecommerce_sales (product_name, category, revenue, created_at)
        VALUES (?, ?, ?, ?)
    """, [
        ("Aftabi Shilajit (Raw)", "Organic Foods", 45210.00, "2026-09-01"),
        ("Raw Honey (Suffah)", "Organic Foods", 38900.50, "2026-09-02"),
        ("FastAPI Backend License", "Software", 18200.00, "2026-09-03"),
        ("Custom Web Scraper", "Software", 21450.75, "2026-09-04"),
        ("Data Analytics Audit", "Consulting", 15000.00, "2026-09-05")
    ])

    cursor.execute("""
        CREATE TABLE user_sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            device_type TEXT NOT NULL,
            duration_seconds INTEGER NOT NULL,
            bounced BOOLEAN NOT NULL
        )
    """)
    cursor.executemany("""
        INSERT INTO user_sessions (session_id, user_id, device_type, duration_seconds, bounced)
        VALUES (?, ?, ?, ?, ?)
    """, [
        ("S001", "U109", "Desktop", 420, 0),
        ("S002", "U214", "Mobile", 85, 1),
        ("S003", "U305", "Desktop", 610, 0),
        ("S004", "U412", "Tablet", 210, 0)
    ])

    conn.commit()
    return conn

db_conn = init_sandbox_db()


# ---------------------------------------------------------------------------
# 4. API ROUTES
# ---------------------------------------------------------------------------

@app.get("/", tags=["System"])
async def root():
    return {
        "service": "Dev Analytics Engine API",
        "groq_configured": groq_client is not None,
        "status": "online"
    }


@app.get("/api/v1/health", tags=["System"])
async def health_check():
    return {
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "groq_active": groq_client is not None
    }


@app.get("/api/v1/analytics/kpi", tags=["Analytics"])
async def get_kpi_metrics(category: Optional[str] = "sales"):
    kpi_store = {
        "sales": {
            "title": "Sales & Revenue Velocity Trends",
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "data": [12400, 15800, 14200, 19100, 24500, 28900, 34020],
            "total_revenue": 148920.00,
            "conversion_rate": "4.82%",
            "donut": {"labels": ["Organic", "Direct", "Referral", "Paid"], "series": [45, 25, 18, 12]}
        },
        "user_retention": {
            "title": "User Retention & Active Cohorts",
            "labels": ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7"],
            "data": [100, 78, 65, 58, 54, 51, 49],
            "total_revenue": "84.2% DAU/MAU",
            "conversion_rate": "62.4%",
            "donut": {"labels": ["Desktop", "Mobile App", "Web App"], "series": [60, 25, 15]}
        },
        "scraping": {
            "title": "Data Extraction Throughput",
            "labels": ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
            "data": [320000, 410000, 580000, 720000, 890000, 650000, 480000],
            "total_revenue": "2,841,050 Records",
            "conversion_rate": "99.85%",
            "donut": {"labels": ["PostgreSQL", "SQLite Engine", "Cloud"], "series": [50, 30, 20]}
        }
    }

    if category not in kpi_store:
        raise HTTPException(status_code=404, detail="Requested analytics category not found.")
    
    return JSONResponse(content=kpi_store[category])


@app.post("/api/v1/sql/execute", response_model=SQLQueryResponse, tags=["SQL Sandbox"])
async def execute_sql_query(payload: SQLQueryRequest):
    clean_query = payload.query.strip()

    if not clean_query.upper().startswith("SELECT"):
        raise HTTPException(
            status_code=400, 
            detail="Security Violation: Only SELECT read-only queries are permitted."
        )

    start_time = time.perf_counter()
    try:
        cursor = db_conn.cursor()
        cursor.execute(clean_query)
        
        columns = [description[0] for description in cursor.description] if cursor.description else []
        raw_rows = cursor.fetchall()
        
        execution_time = (time.perf_counter() - start_time) * 1000
        formatted_rows = [dict(zip(columns, row)) for row in raw_rows[:payload.limit]]

        return SQLQueryResponse(
            status="success",
            execution_time_ms=round(execution_time, 2),
            columns=columns,
            rows=formatted_rows,
            row_count=len(formatted_rows)
        )

    except sqlite3.Error as e:
        raise HTTPException(status_code=400, detail=f"SQL Execution Error: {str(e)}")


@app.post("/api/v1/ai/chat", tags=["AI Assistant"])
async def chat_assistant(payload: ChatRequest):
    """
    Executes live LLM queries via Groq API (using Llama 3.3 70B).
    """
    if not groq_client:
        return {
            "role": "assistant",
            "content": "DevBot AI system is running in standard mode (Groq API key not set).",
            "timestamp": datetime.utcnow().isoformat()
        }

    try:
        # System prompt giving context about Muhammad Huzaifa
        system_instruction = (
            "You are DevBot, an intelligent portfolio assistant for Muhammad Huzaifa. "
            "Muhammad Huzaifa is a Freelance Full-Stack Developer, Web Designer, and Data Analyst based in Kasur, Pakistan. "
            "Key details about Huzaifa:\n"
            "- Certification: Microsoft Certified: Fabric Analytics Engineer Associate (DP-600).\n"
            "- Tech Stack: Python (FastAPI, Flask), JavaScript (Vue.js), SQL (PostgreSQL, T-SQL, SQLite), Docker, ML (XGBoost, pandas).\n"
            "- Recent Projects: EcoSnap AI (Vision Transformer + FLUX.1), NeuroPace AI (FastAPI + Gemini), EcoSync.\n"
            "Be polite, technical, concise, and helpful."
        )

        # Build conversation history for Groq API call
        groq_messages = [{"role": "system", "content": system_instruction}]
        for msg in payload.messages:
            groq_messages.append({"role": msg.role, "content": msg.content})

        # Call Groq LLM endpoint
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            temperature=0.7,
            max_tokens=400,
        )

        ai_response = completion.choices[0].message.content

        return {
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")


@app.post("/api/v1/contact", tags=["Consultation"])
async def submit_consultation(payload: ConsultationRequest, background_tasks: BackgroundTasks):
    def log_consultation_task(data: ConsultationRequest):
        print(f"[NEW INQUIRY] From: {data.full_name} ({data.email}) | Category: {data.service_category}")

    background_tasks.add_task(log_consultation_task, payload)

    return {
        "status": "transmitted",
        "message": "Thank you for reaching out! Your project specifications have been received.",
        "received_at": datetime.utcnow().isoformat()
    }


# ---------------------------------------------------------------------------
# 5. ENTRYPOINT BINDING
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)