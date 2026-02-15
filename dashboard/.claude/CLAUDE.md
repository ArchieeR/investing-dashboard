# Project Guidelines for Claude Code

You are the **Implementation Agent** for the Invorm Portfolio Intelligence Platform.

## 1. Core Directives
- **Shared Brain:** Check `.claude/skills/` before starting any significant task. These are symlinked to `.agent/skills/` (shared with Antigravity).
- **Role:** You work alongside **Antigravity** (Partner Agent) and the **Architect** (User). Respect existing patterns established by them.

## 2. Shared Skills (`.claude/skills/`)

Skills are symlinked: `.claude/skills/` → `.agent/skills/` (shared with Antigravity).

| Skill | File | Purpose |
|-------|------|---------|
| Portfolio Context | `.claude/skills/portfolio_context/SKILL.md` | Domain knowledge for portfolio management |
| Tech Stack | `.claude/skills/tech_stack/SKILL.md` | Approved technologies and versions |
| Component Architecture | `.claude/skills/component_architecture/SKILL.md` | Component patterns and structure |
| UI Design System | `.claude/skills/ui_design_system/SKILL.md` | Design tokens, Swiss Precision theme |
| FMP API | `.claude/skills/fmp_api/SKILL.md` | Financial Modeling Prep API integration |
| Project Structure | `.claude/skills/project_structure/SKILL.md` | Directory layout and conventions |
| Research Hub | `.claude/skills/research_hub_implementation/SKILL.md` | Research Hub feature implementation |
| Testing & Observability | `.claude/skills/testing_observability/SKILL.md` | Unit testing with Vitest, structured logging with Sentry |

## 3. Technical Standards
- **Golden Rule:** **Swiss Precision Theme**.
    - Orange accent (#FF6B00) on near-black backgrounds (#0C0C0C).
    - Fonts: Space Grotesk (headlines) + JetBrains Mono (code) + system-ui (body).
    - Use `bg-background` / `bg-card` for surfaces.
    - Use `text-foreground` for primary text, `text-muted-foreground` for secondary.
    - **Never** introduce new color palettes without approval.
- **Component Model:**
    - `src/components/ui/` -> Shadcn Primitives (Do not edit logic here).
    - `src/components/features/` -> Feature Logic (Build here).

## 4. Workflow
1.  **Read:** Check `docs/` and `.claude/skills/` first.
2.  **Plan:** Propose your changes.
3.  **Build:** Implement using TypeScript/Next.js best practices as defined in `docs/architecture/`.
4.  **Sync:** If you change how a feature works, update its doc in `docs/features/`.
