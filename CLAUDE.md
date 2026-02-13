# CLAUDE.md

> Think carefully and implement the most concise solution that changes as little code as possible.

## Project Overview

Portfolio intelligence platform for UK investors. Codename: "Invorm" (temporary).

## Repository Structure

- `dashboard/` - Next.js 16 application (main codebase) - has its own `.claude/` and `.agent/` with domain-specific skills
- `_archive/` - Legacy reference code and UI mockups (local only, gitignored)
- `docs/` - Synthesis docs, planning, architecture

## Tech Stack

- Next.js 16 + React 19 + TypeScript strict
- Tailwind v4 + Shadcn/UI + Framer Motion
- Firebase (Auth, Firestore, Functions Gen 2)
- FMP API (40+ endpoints, Zod-validated) + Apify (LSE pricing)
- Stripe (Free / Pro £12/mo)
- Genkit + Vertex AI (AI chat)
- Sentry (observability)

## Key Rules

- **Swiss Precision Theme**: Orange (#FF6B00) on near-black (#0C0C0C). Space Grotesk + JetBrains Mono + system-ui.
- **Component Architecture**: `src/components/ui/` = Shadcn primitives (don't edit). `src/components/features/` = business logic.
- **Mobile-first**: All layouts responsive with `md:` breakpoints.
- **No hardcoded product name**: Use config/env for branding.
- **UK-focused**: ISA/SIPP/GIA accounts, GBP base currency, GBX/GBp handling.

## Testing

- Vitest for unit tests
- Co-located test files (`*.test.ts` next to source)
- Run: `npm test` in `dashboard/`

## CCPM Workflow

- Start session: `/context:prime` → `/pm:status` → `/pm:next`
- PRDs: `.claude/prds/`
- Epics: `.claude/epics/`
- Context: `.claude/context/`

## Shared Skills

Skills in `dashboard/.agent/skills/` are symlinked to `dashboard/.claude/skills/` (shared with Antigravity).
Global skills in `~/.claude/skills/` include: firebase-development, genkit-vertex-setup, vercel-troubleshooting, claude-manage, ag-context, find-skills.
