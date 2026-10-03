import os
import json
import time
import traceback
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

# 1. Load environment variables
load_dotenv()

app = FastAPI(
    title="Dev Analytics Platform API",
    description="Backend API for Chatbot and SQL Engine",
    version="1.0.0"
)

# 2. CORS Middleware inside main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Request Models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = None

class SqlRequest(BaseModel):
    query: str


def load_knowledge_context() -> str:
    """Safely loads data.json without breaking main.py if file is missing/invalid."""
    data_path = os.path.join(os.path.dirname(__file__), "data.json")
    if not os.path.exists(data_path):
        return "Developer Profile: GitHub: https://github.com/MuhammadHuzaifaG | Kaggle: https://www.kaggle.com/muhammadhuzaifagohar | Email: message.huzaifa@gmail.com"

    try:
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        profile = data.get("profile", {})
        kb = data.get("ai_knowledge_base", [])

        github_link = profile.get("github", "https://github.com/MuhammadHuzaifaG")
        kaggle_link = profile.get("kaggle", "https://www.kaggle.com/muhammadhuzaifagohar")
        email_addr = profile.get("email", "message.huzaifa@gmail.com")

        kb_summary = "\n".join([f"- {item.get('response')}" for item in kb])

        return f"""
DEVELOPER PROFILE & REPOSITORY LINKS:
- Official GitHub Profile: {github_link}
- Official Kaggle Profile: {kaggle_link}
- Primary Business Email: {email_addr}

VERIFIED KNOWLEDGE BASE & PAST WORK:
{kb_summary}
"""
    except Exception as e:
        print(f"[WARN] Failed to read data.json context: {e}")
        return "Developer Profile: GitHub: https://github.com/mhuzaifi0604 | Kaggle: https://www.kaggle.com | Email: message.huzaifa@gmail.com"


def build_system_prompt() -> str:
    """Combines core system rules with dynamic profile context from data.json."""
    context_data = load_knowledge_context()
    
    return f"""You are the elite AI Assistant for DevAnalytics.
YOUR TECH STACK & CORE SERVICES:
1. Web Design & Development: Custom WordPress design, WooCommerce stores, custom PHP/WordPress plugin development, database/performance optimization, Technical SEO, and On-Page SEO.
2. Data Intelligence & Analysis: Advanced Analytics, Data Cleansing, Python Data Extraction, Web Scraping, SQL, MS Excel, interactive Tableau dashboards (Sales, Healthcare, Executive KPIs), machine learning models (XGBoost), and custom Business Intelligence (BI) solutions.

{context_data}

YOUR OPERATIONAL BLUEPRINT & CONSTRAINTS:
1. BREVITY RULE (CRITICAL): Keep every response short strictly (1 sentence only), high-impact.
2. CONTEXT & ENGAGEMENT: Maintain conversational context across follow-ups, tailoring every answer directly to the user's specific business need.
3. Balance a welcoming tone with an authoritative, modern, high-precision technical persona focused on client business resolution and maximum ROI. Track ongoing conversation. Never repeat greetings or contact info in follow-up messages.
4. PROFESSIONAL PERSONA: Maintain an authoritative, modern, high-precision technical persona focused on client business resolution and maximum ROI.
5. HIGH-CONVERSION ENGINE: Consistently guide prospects toward structured, milestone-based deployments via safe milestone payment methods.
6. CALL TO ACTION (CTA): Direct prospective clients to complete the website Contact Form or email directly "email: message.huzaifa@gmail.com" for formal project scoping, custom quotes, and milestone timelines. (ONLY when the user asks)
7. PROJECT, CODE & KAGGLE ENQUIRIES: If a user asks to view existing projects, code samples, past work, or Kaggle models, provide the official GitHub profile link (https://github.com/mhuzaifi0604) or Kaggle profile link (https://www.kaggle.com).
8. DOMAIN BOUNDARIES: If the user asks about topics unrelated to web development, SEO, web scraping, data analytics, or machine learning, politely redirect them back to DevAnalytics' core services in a single line."""


@app.get("/")
async def root():
    return {"status": "online", "message": "Dev Analytics API is operational"}


@app.post("/api/v1/ai/chat")
async def chat_endpoint(request: ChatRequest):
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY environment variable is missing on server. Add it to your .env file or Render settings."
        )

    model_candidates = [
        request.model,
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
    ]
    
    models_to_try = [m for m in model_candidates if m]

    client = Groq(api_key=groq_api_key)

    # 1. Generate system prompt containing dynamic data.json rules
    system_prompt_content = build_system_prompt()

    # 2. Prepend system prompt to the API message array
    formatted_messages = [{"role": "system", "content": system_prompt_content}] + [
        {"role": msg.role, "content": msg.content} for msg in request.messages
    ]

    last_error = None

    for model_name in models_to_try:
        try:
            print(f"[INFO] Executing request with model: '{model_name}'")
            
            completion = client.chat.completions.create(
                model=model_name,
                messages=formatted_messages,
                max_tokens=1024,
                temperature=0.7
            )

            reply_content = completion.choices[0].message.content

            return {
                "role": "assistant",
                "content": reply_content,
                "reply": reply_content,
                "model_used": model_name
            }

        except Exception as e:
            error_str = str(e)
            last_error = error_str
            print(f"[WARN] Model '{model_name}' failed: {error_str}")
            
            if any(err in error_str for err in ["404", "400", "model_not_found", "model_decommissioned"]):
                continue
            else:
                break

    raise HTTPException(
        status_code=500,
        detail=f"Groq API Error: {last_error}"
    )


@app.post("/api/v1/sql/execute")
async def execute_sql_endpoint(request: SqlRequest):
    start_time = time.time()
    query = request.query.strip()

    if not query:
        raise HTTPException(status_code=400, detail="SQL Query cannot be empty.")

    mock_columns = ["category", "total_revenue"]
    mock_rows = [
        {"category": "Electronics", "total_revenue": "$84,200.00"},
        {"category": "Apparel", "total_revenue": "$42,150.00"},
        {"category": "Home Goods", "total_revenue": "$22,400.00"},
        {"category": "Books", "total_revenue": "$12,800.00"},
        {"category": "Beauty", "total_revenue": "$7,370.00"}
    ]

    execution_time = round((time.time() - start_time) * 1000 + 12, 2)

    return {
        "status": "success",
        "columns": mock_columns,
        "rows": mock_rows,
        "row_count": len(mock_rows),
        "execution_time_ms": execution_time
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
