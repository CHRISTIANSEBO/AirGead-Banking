#!/usr/bin/env python3
# Christian Sebo
# AIRGEAD BANKING - AI-Enhanced Investment Calculator
# Original C++ version: 06/01/2024
# AI features added: 2026

import os
import sys


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
# AI Financial Advisor powered by Claude
# ─────────────────────────────────────────────
class AIFinancialAdvisor:
    """
    Sends investment data to Claude and returns personalised financial advice.

    Requires the ANTHROPIC_API_KEY environment variable to be set.
    """

    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "\n[AI Advisor] ANTHROPIC_API_KEY environment variable is not set.\n"
                "  Get a free key at https://console.anthropic.com and run:\n"
                "  export ANTHROPIC_API_KEY='your-key-here'\n"
            )
        try:
            import anthropic
            self._client = anthropic.Anthropic(api_key=api_key)
        except ImportError:
            raise ImportError(
                "The 'anthropic' package is not installed.\n"
                "  Run: pip install anthropic"
            )

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

        import anthropic
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


def main():
    print("=" * 54)
    print("    Welcome to the Airgead Banking Investment Calculator")
    print("              Now with AI Financial Advice!")
    print("=" * 54)
    print()

    # Collect user input
    initial_investment = get_positive_float("Enter initial investment amount: $")
    monthly_deposit    = get_positive_float("Enter monthly deposit amount:   $")
    annual_rate        = get_positive_float("Enter annual interest rate (%): ")
    years              = get_positive_int(  "Enter number of years to invest: ")

    # Run calculations
    calculator = InvestmentCalculator(initial_investment, monthly_deposit, annual_rate, years)
    calculator.calculate_without_monthly_deposits()
    calculator.calculate_with_monthly_deposits()

    # Display tables
    print("\n" + "=" * 54)
    print("                  INVESTMENT PROJECTIONS")
    print("=" * 54)
    calculator.display_results()

    # AI Financial Advisor
    print("=" * 54)
    print("              AI FINANCIAL ADVISOR (Claude)")
    print("=" * 54)

    try:
        advisor = AIFinancialAdvisor()
        print("\nAnalyzing your investment plan...\n")
        advice = advisor.get_advice(calculator)
        print(advice)
    except EnvironmentError as e:
        print(e)
        print("[Tip] The calculator still works perfectly without the AI advisor.")
    except Exception as e:
        print(f"\n[AI Advisor] Could not retrieve advice: {e}")

    print("\n" + "=" * 54)


if __name__ == "__main__":
    main()
