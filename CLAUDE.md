# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is Tony Aizize's GitHub profile repository (`Aibier/Aibier`). The special `README.md` at the root renders as the public-facing GitHub profile page at github.com/Aibier. There is no build system, no dependencies, and no test suite — the entire "product" is the README content and the two PDFs (`resume.pdf`, `portfolio.pdf`).

## Content Structure

| File | Purpose |
|------|---------|
| `README.md` | GitHub profile page — the primary artifact |
| `resume.pdf` | Downloadable resume/CV |
| `portfolio.pdf` | Detailed technical portfolio |

## Owner Profile (for context when editing)

- **Role**: Software Engineering Manager, Payments & FX Infra at Aspire (Singapore fintech)
- **Core expertise**: Go (10+ years), payment systems, distributed/event-driven microservices
- **Notable integrations**: 50+ banks/providers (JPM, DBS, Wise, PayPal, Stripe, RippleNet, GrabPay, TikTok Pay, etc.)
- **Key numbers to preserve**: $50M+ monthly volume, 2M+ daily transactions, 50% integration timeline reduction
- **Planned open-source project**: Taymas-Bank (bank integration samples — planned end of 2025)
- **LinkedIn**: linkedin.com/in/tony007/
- **GitHub**: github.com/Aibier

## README Conventions

- Sections use emoji headers (👋, 🛠️, 🚀, 🏆, etc.) — maintain this style when adding sections
- GitHub Stats widgets use `vercel.app` and `herokuapp.com` badge services — leave those URLs intact
- The `📬 Let's Connect` section uses raw HTML `<div align="center">` with badge shields — preserve that formatting
- The email badge currently links to `mailto:your-email@example.com` (placeholder — can be updated with real address)
- The `bank-integrations.pdf` link in Documents & Resources points to a non-existent file (`https://github.com/Aibier/bank-integrations.pdf`) — this is a known gap

## Workflow

Changes are made directly to `README.md` and committed. No staging environments or previews exist beyond viewing the rendered Markdown locally. GitHub renders the profile page live after pushing to `main`.
