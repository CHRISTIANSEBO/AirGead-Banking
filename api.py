#!/usr/bin/env python3
"""
FastAPI backend for AirGead Banking frontend.
Exposes AI features (Claude) as REST/SSE endpoints.
Math calculations happen client-side in TypeScript.
"""

import os
import json
from typing import Any, Generator

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# ─────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────

app = FastAPI(title="AirGead Banking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
