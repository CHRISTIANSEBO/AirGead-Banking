# AirGead Banking — Investment Calculator

An interactive compound-interest calculator that helps users visualize how their
investments grow over time, with and without recurring monthly deposits. Built to
make fiscal responsibility and the power of compounding tangible and easy to explore.

> **Origin:** This started as my **final project for a Computer Science course at
> Southern New Hampshire University** (originally written in C++). I rebuilt it into
> a modern full-stack web app with a React/TypeScript frontend, a FastAPI backend,
> and an AI financial advisor powered by Claude.

## Features

- **Compound interest projections** — year-by-year balances with monthly compounding,
  calculated both with and without recurring monthly deposits.
- **Growth visualization** — interactive charts (Recharts) comparing the two scenarios.
- **Milestone tracking** — automatically detects when the portfolio crosses key
  thresholds ($10K → $1M) and shows the year each is reached.
- **AI financial advisor** — a Claude-powered chat that answers questions about the
  projection, plus natural-language goal parsing (e.g. "I want $1M in 30 years").
- **Client-side math, AI via API** — all financial calculations run in the browser
  for instant feedback; only AI features call the backend.

## Tech Stack

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · Recharts
**Backend:** Python · FastAPI · Uvicorn · Anthropic Claude API (SSE streaming)

## Project Structure

```
airgead-banking/
├── api.py                    # FastAPI backend (AI chat + goal parsing)
├── airgead_banking.py        # Python reference implementation of the calculator
├── requirements.txt
├── docs/                     # Original coursework pseudocode
└── frontend/
    └── src/
        ├── lib/calculator.ts # Core compound-interest logic
        ├── hooks/            # useCalculator, useAIChat
        └── components/       # Hero, InputPanel, GrowthChart, ResultsDashboard, ...
```

## Running Locally

### Backend (AI features)

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=***          # required for AI advisor
uvicorn api:app --reload --port 8000
```

The AI endpoints degrade gracefully: if `ANTHROPIC_API_KEY` is not set, the
calculator still works and AI features simply report as unavailable.

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### Configuration

| Env var             | Description                                              | Default                                             |
| ------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Enables the AI advisor / goal parsing                    | _(unset — AI disabled)_                             |
| `ALLOWED_ORIGINS`   | Comma-separated CORS origins for the API (for deployment) | `http://localhost:5173,http://127.0.0.1:5173`       |

## How It Works

The calculator projects a starting balance forward over N years. Without monthly
deposits it applies simple annual compounding; with deposits it compounds monthly
and adds the contribution before each month's interest. Both series are computed
client-side (`frontend/src/lib/calculator.ts`) so the charts and table update
instantly as you adjust inputs.

## License

MIT — see [LICENSE](LICENSE).
