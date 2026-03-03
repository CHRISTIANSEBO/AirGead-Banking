#!/usr/bin/env python3
# Christian Sebo
# AIRGEAD BANKING - AI-Enhanced Investment Calculator
# Original C++ version: 06/01/2024
# AI features added: 2026

import os
import sys
import anthropic


# ─────────────────────────────────────────────
# Data class: one year of investment results
# ─────────────────────────────────────────────
class InvestmentRecord:
    def __init__(self, year: int, balance: float, interest_earned: float):
        self.year = year
        self.balance = balance
        self.interest_earned = interest_earned


# ─────────────────────────────────────────────
# Core calculator (mirrors original C++ logic)
# ─────────────────────────────────────────────
class InvestmentCalculator:
    def __init__(self, initial: float, monthly: float, annual_rate: float, years: int):
        self.initial_investment = initial
        self.monthly_deposit = monthly
        self.annual_interest_rate = annual_rate
        self.number_of_years = years
        self.results_no_deposit: list[InvestmentRecord] = []
        self.results_with_deposit: list[InvestmentRecord] = []

    def calculate_without_monthly_deposits(self):
        current_balance = self.initial_investment
        for year in range(1, self.number_of_years + 1):
            interest_earned = current_balance * (self.annual_interest_rate / 100)
            current_balance += interest_earned
            self.results_no_deposit.append(
                InvestmentRecord(year, current_balance, interest_earned)
            )

    def calculate_with_monthly_deposits(self):
        current_balance = self.initial_investment
        for year in range(1, self.number_of_years + 1):
            total_interest = 0.0
            for _ in range(12):
                monthly_rate = (self.annual_interest_rate / 100) / 12
                current_balance += self.monthly_deposit
                interest = current_balance * monthly_rate
                current_balance += interest
                total_interest += interest
            self.results_with_deposit.append(
                InvestmentRecord(year, current_balance, total_interest)
            )

    def display_results(self):
        print()
        print(f"{'Year':<6} {'Balance w/o Deposits':>24} {'Interest Earned':>20}")
        print("-" * 54)
        for r in self.results_no_deposit:
            print(f"{r.year:<6} ${r.balance:>23,.2f} ${r.interest_earned:>19,.2f}")

        print()
        print(f"{'Year':<6} {'Balance w/ Deposits':>24} {'Interest Earned':>20}")
        print("-" * 54)
        for r in self.results_with_deposit:
            print(f"{r.year:<6} ${r.balance:>23,.2f} ${r.interest_earned:>19,.2f}")
        print()


# ─────────────────────────────────────────────
# Tool use: natural language → investment params
# ─────────────────────────────────────────────

# Tool definition sent to Claude so it knows what structured data to return.
# Two tools: one for a complete parameter set, one to ask a clarifying question.
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


def parse_investment_goal(client: anthropic.Anthropic, user_text: str) -> dict:
    """
    Send the user's free-text description to Claude with the tool definitions.

    Returns one of:
      {"tool": "run_investment_calculator", "params": {...}}  — all values found
      {"tool": "request_clarification",     "question": "..."} — something missing
    """
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
                    f"Description: {user_text}"
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

    # Fallback — Claude didn't call a tool (shouldn't happen, but handle gracefully)
    return {
        "tool": "request_clarification",
        "question": "Could you share your starting amount, monthly savings, expected return rate, and how many years you plan to invest?",
    }


def natural_language_mode(client: anthropic.Anthropic):
    """
    Let the user describe their investment goal in plain English.
    Loop until Claude has all four parameters, then run the calculator.
    """
    print("\nDescribe your investment goal in plain English.")
    print('Example: "I have $3k saved, can add $150/month, expecting 7%, retiring in 25 years."\n')

    while True:
        user_text = input("> ").strip()
        if not user_text:
            continue

        print("\nParsing your goal...\n")
        result = parse_investment_goal(client, user_text)

        if result["tool"] == "request_clarification":
            print(f"  Claude: {result['question']}\n")
            continue

        # All parameters extracted — confirm with user before running
        p = result["params"]
        print("  Extracted parameters:")
        print(f"    Initial investment : ${p['initial_investment']:,.2f}")
        print(f"    Monthly deposit    : ${p['monthly_deposit']:,.2f}")
        print(f"    Annual rate        : {p['annual_interest_rate']}%")
        print(f"    Years              : {p['years']}")
        confirm = input("\n  Run calculation with these values? [Y/n]: ").strip().lower()
        if confirm in ("n", "no"):
            print("\n  Let's try again — describe your goal:\n")
            continue

        return p["initial_investment"], p["monthly_deposit"], p["annual_interest_rate"], p["years"]


# ─────────────────────────────────────────────
# AI Financial Advisor powered by Claude
# ─────────────────────────────────────────────
class AIFinancialAdvisor:
    """
    Sends investment data to Claude and returns personalised financial advice.

    Requires the ANTHROPIC_API_KEY environment variable to be set.
    """

    def __init__(self, client: anthropic.Anthropic):
        self._client = client

    def get_advice(self, calculator: InvestmentCalculator) -> str:
        """Build a prompt from the calculator results and call Claude."""
        final_no_dep = calculator.results_no_deposit[-1]
        final_with_dep = calculator.results_with_deposit[-1]

        prompt = f"""You are a friendly financial advisor helping a high-school student understand
compound interest and smart saving habits.

Here are the investment details they entered:
- Initial investment: ${calculator.initial_investment:,.2f}
- Monthly deposit: ${calculator.monthly_deposit:,.2f}
- Annual interest rate: {calculator.annual_interest_rate}%
- Investment period: {calculator.number_of_years} years

Results after {calculator.number_of_years} years:
- WITHOUT monthly deposits → Balance: ${final_no_dep.balance:,.2f}
- WITH monthly deposits    → Balance: ${final_with_dep.balance:,.2f}
- Extra gained by making monthly deposits: ${final_with_dep.balance - final_no_dep.balance:,.2f}

Please provide:
1. A plain-English explanation of what these numbers mean
2. One concrete takeaway about the power of regular contributions
3. One practical tip the student can act on today to improve their financial future
4. A brief note on whether the interest rate they used is realistic

Keep your response encouraging, concise (under 200 words), and jargon-free."""

        message = self._client.messages.create(
            model="claude-opus-4-6",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text


# ─────────────────────────────────────────────
# Main program
# ─────────────────────────────────────────────
def get_positive_float(prompt: str) -> float:
    while True:
        try:
            value = float(input(prompt))
            if value < 0:
                print("  Please enter a non-negative number.")
                continue
            return value
        except ValueError:
            print("  Invalid input. Please enter a number.")


def get_positive_int(prompt: str) -> int:
    while True:
        try:
            value = int(input(prompt))
            if value <= 0:
                print("  Please enter a positive whole number.")
                continue
            return value
        except ValueError:
            print("  Invalid input. Please enter a whole number.")


def build_client() -> anthropic.Anthropic | None:
    """Create and return an Anthropic client, or None if no API key is set."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    return anthropic.Anthropic(api_key=api_key)


def main():
    print("=" * 54)
    print("    Welcome to the Airgead Banking Investment Calculator")
    print("              Now with AI Financial Advice!")
    print("=" * 54)
    print()

    client = build_client()

    # ── Input mode selection ──────────────────────────────────
    if client:
        print("How would you like to enter your investment details?")
        print("  [1] Guided input  (answer prompts one by one)")
        print("  [2] Describe goal (type naturally, AI extracts values)")
        print()
        choice = input("Choose [1/2]: ").strip()
    else:
        print("[Note] ANTHROPIC_API_KEY not set — using guided input only.")
        print("       Set it to unlock AI-powered natural language input and advice.\n")
        choice = "1"

    print()

    # ── Collect parameters ────────────────────────────────────
    if choice == "2" and client:
        initial_investment, monthly_deposit, annual_rate, years = natural_language_mode(client)
    else:
        initial_investment = get_positive_float("Enter initial investment amount: $")
        monthly_deposit    = get_positive_float("Enter monthly deposit amount:   $")
        annual_rate        = get_positive_float("Enter annual interest rate (%): ")
        years              = get_positive_int(  "Enter number of years to invest: ")

    # ── Run calculations ──────────────────────────────────────
    calculator = InvestmentCalculator(initial_investment, monthly_deposit, annual_rate, years)
    calculator.calculate_without_monthly_deposits()
    calculator.calculate_with_monthly_deposits()

    # ── Display tables ────────────────────────────────────────
    print("\n" + "=" * 54)
    print("                  INVESTMENT PROJECTIONS")
    print("=" * 54)
    calculator.display_results()

    # ── AI Financial Advisor ──────────────────────────────────
    print("=" * 54)
    print("              AI FINANCIAL ADVISOR (Claude)")
    print("=" * 54)

    if client:
        try:
            advisor = AIFinancialAdvisor(client)
            print("\nAnalyzing your investment plan...\n")
            advice = advisor.get_advice(calculator)
            print(advice)
        except Exception as e:
            print(f"\n[AI Advisor] Could not retrieve advice: {e}")
    else:
        print("\n[AI Advisor] Set ANTHROPIC_API_KEY to receive personalised advice.")

    print("\n" + "=" * 54)


if __name__ == "__main__":
    main()
