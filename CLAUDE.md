# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is Tony Aizize's GitHub profile repository (`Aibier/Aibier`). The special `README.md` at the root renders as the public-facing GitHub profile page at github.com/Aibier. The repo also contains a Markdown-to-PDF build pipeline for generating `resume.pdf` from `resume.md`.

## Content Structure

| File | Purpose |
|------|---------|
| `README.md` | GitHub profile page — the primary artifact |
| `resume.md` | Resume source — edit this, then run `make resume` to rebuild |
| `resume.pdf` | Built from `resume.md` via Puppeteer — do not edit directly |
| `portfolio.pdf` | Original uploaded portfolio — not generated from Markdown, do not overwrite |
| `Makefile` | `make resume` · `make portfolio` · `make all` |
| `scripts/build-pdf.js` | Markdown → PDF builder (marked + Puppeteer) |
| `templates/` | CSS themes: `base.css`, `resume.css`, `portfolio.css`, `default.css` |

## Owner Profile (for context when editing)

- **Current role**: Senior Engineering Manager at YouTrip (Singapore fintech) — since Dec 2025
- **Previous role**: Software Engineering Manager, Payments & FX Infra at Aspire FT — Mar 2025 to Dec 2025
- **Core expertise**: Go (10+ years), payment systems, distributed/event-driven microservices, card issuing
- **Current focus**: Multi-currency wallets (MCA), card payment platforms, YouBiz business accounts — 20+ engineers
- **Notable integrations**: 50+ banks/providers (JPM, DBS, Wise, PayPal, Stripe, RippleNet, GrabPay, TikTok Pay, etc.)
- **Key numbers to preserve**: $50M+ monthly volume, 2M+ daily transactions, 50% integration timeline reduction
- **Planned open-source project**: Taymas-Bank (bank integration samples — planned end of 2025)
- **LinkedIn**: linkedin.com/in/tony007/
- **GitHub**: github.com/Aibier

## README Conventions

- Sections use emoji headers (👋, 🛠️, 🚀, 🏆, etc.) — maintain this style when adding sections
- Country flags and provider/brand emojis are used throughout — preserve and extend this pattern
- GitHub Stats widgets use `vercel.app` and `herokuapp.com` badge services — leave those URLs intact
- The `📬 Let's Connect` section uses raw HTML `<div align="center">` with badge shields — preserve that formatting
- The email badge links to `mailto:tony.aizize@you.co`
- The `bank-integrations.pdf` link in Documents & Resources points to a non-existent file — this is a known gap

## PDF Build Workflow

```bash
make resume      # rebuild resume.pdf from resume.md
make portfolio   # rebuild portfolio.pdf from portfolio.md (if it exists)
make all         # install deps + build all
```

- Always edit `resume.md`, never edit `resume.pdf` directly
- `portfolio.pdf` is the original uploaded file — do not regenerate it unless explicitly asked
- The build script auto-detects theme from filename (`resume` → `resume.css`, etc.)
- YAML front matter in `.md` files controls theme, format, and margins

## Workflow

1. Edit `README.md` for profile page changes — commit directly
2. Edit `resume.md` for resume changes → run `make resume` → commit both files
3. GitHub renders the profile page live after pushing to `main`
