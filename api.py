#!/usr/bin/env python3
"""
FastAPI backend for AirGead Banking frontend.
Exposes AI features (Claude) as REST/SSE endpoints.
Math calculations happen client-side in TypeScript.
"""

import os
import json
from pathlib import Path
from typing import Any, Generator

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ─────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────

app = FastAPI(title="AirGead Banking API")

# Allowed origins default to local dev; override in production with a
# comma-separated ALLOWED_ORIGINS env var (e.g. "https://airgead.example.com").
_DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
allowed_origins = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", _DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_client() -> anthropic.Anthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY not configured. AI features are unavailable.",
        )
    return anthropic.Anthropic(api_key=api_key)


# ─────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ParseGoalRequest(BaseModel):
    text: str


# ─────────────────────────────────────────────
# Tool definitions (same as CLI version)
# ─────────────────────────────────────────────

INVESTMENT_TOOLS = [
    {
        "name": "run_investment_calculator",
        "description": (
            "Called when all four investment parameters are clearly present in the "
            "user's message. Extracts and returns them as structured data."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "initial_investment": {
                    "type": "number",
                    "description": "Starting lump-sum in dollars (e.g. 5000)",
                },
                "monthly_deposit": {
                    "type": "number",
                    "description": "Recurring monthly contribution in dollars (e.g. 200)",
                },
                "annual_interest_rate": {
                    "type": "number",
                    "description": "Annual return rate as a percentage (e.g. 7 for 7%)",
                },
                "years": {
                    "type": "integer",
                    "description": "Investment horizon in whole years (e.g. 20)",
                },
            },
            "required": ["initial_investment", "monthly_deposit", "annual_interest_rate", "years"],
        },
    },
    {
        "name": "request_clarification",
        "description": (
            "Called when one or more parameters are missing or ambiguous. "
            "Asks the user a focused question to get the missing information."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "question": {
                    "type": "string",
                    "description": "A friendly, specific question asking for the missing details.",
                }
            },
            "required": ["question"],
        },
    },
]

ADVISOR_SYSTEM = (
    "You are a friendly financial advisor helping a high-school student understand "
    "compound interest and smart saving habits. Keep responses encouraging, "
    "concise (under 200 words), and jargon-free."
)


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.get("/api/health")
def health():
    """Check if AI features are available."""
    has_key = bool(os.environ.get("ANTHROPIC_API_KEY"))
    return {"status": "ok", "ai_available": has_key}


@app.post("/api/chat")
def chat(request: ChatRequest):
    """
    Stream Claude's response via Server-Sent Events.
    Each event is: data: {"text": "..."}\n\n
    """
    client = get_client()
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    def generate() -> Generator[str, None, None]:
        try:
            with client.messages.stream(
                model="claude-opus-4-6",
                max_tokens=512,
                system=ADVISOR_SYSTEM,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    payload = json.dumps({"text": text})
                    yield f"data: {payload}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            payload = json.dumps({"error": str(e)})
            yield f"data: {payload}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/parse-goal")
def parse_goal(request: ParseGoalRequest):
    """
    Use Claude tool use to extract investment parameters from natural language.
    Returns either extracted params or a clarifying question.
    """
    client = get_client()

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=512,
        tools=INVESTMENT_TOOLS,
        messages=[
            {
                "role": "user",
                "content": (
                    "Extract investment parameters from the description below.\n"
                    "Use run_investment_calculator if you have all four values.\n"
                    "Use request_clarification if anything is missing or unclear.\n\n"
                    f"Description: {request.text}"
                ),
            }
        ],
    )

    for block in response.content:
        if block.type == "tool_use":
            if block.name == "run_investment_calculator":
                return {"tool": "run_investment_calculator", "params": block.input}
            if block.name == "request_clarification":
                return {"tool": "request_clarification", "question": block.input["question"]}

    # Fallback
    return {
        "tool": "request_clarification",
        "question": (
            "Could you share your starting amount, monthly savings, "
            "expected return rate, and how many years you plan to invest?"
        ),
    }


# ─────────────────────────────────────────────
# Serve the built frontend (production single-service deploy)
# ─────────────────────────────────────────────
# In production the Vite frontend is built to frontend/dist and served by this
# same app, so the API and UI share one origin (no CORS needed in prod). API
# routes above take precedence; everything else falls back to the SPA.
_FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"

if _FRONTEND_DIST.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=_FRONTEND_DIST / "assets"),
        name="assets",
    )

    @app.get("/")
    def _serve_index() -> FileResponse:
        return FileResponse(_FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}")
    def _serve_spa(full_path: str) -> FileResponse:
        # Serve a real static file if it exists, otherwise fall back to index.html
        # so client-side routing works.
        candidate = _FRONTEND_DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_FRONTEND_DIST / "index.html")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=True)
