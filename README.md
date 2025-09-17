# Portfolio Manager

Local-first React + TypeScript playground for managing investment portfolios. This repo tracks the MVP build as outlined in `docs/spec.md`.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open the printed local URL to view the app.

## Project Layout

- `src/components` – UI components (grid, summaries, etc.)
- `src/state` – app state containers and selectors
- `src/utils` – pure utilities (maths, CSV helpers)
- `tests` – unit tests for utilities and selectors
- `docs` – spec, rules, and task list used for Codex collaboration

Build tasks and engineering guardrails live in `docs/tasks.md` and `docs/rules.md`.
