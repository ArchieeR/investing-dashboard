

# Engineering Rules & Guardrails (for Codex in VS Code)

> Keep this file short, opinionated, and stable. Codex should treat these as **non‑negotiable** unless explicitly overridden in a task.

---

## 1) Scope & Discipline
- **Stay within the task scope.** Do not implement adjacent features unless the task explicitly requires it.
- **Small diffs.** Prefer PR‑sized changes that can be reviewed quickly.
- **No new dependencies** without explicit approval. If a dep seems necessary, propose it first with rationale, bundle size, licence, and alternatives.
- **Do not edit `docs/spec.md` or `docs/rules.md`** unless the task says so. Propose diffs instead.

## 2) Code Quality
- Use **TypeScript** for all app code. Public APIs and component props must be typed.
- Keep functions small and **pure** where possible. Extract pure utilities for core calculations (price×qty=value, target deltas, cash‑buffer maths).
- Avoid premature abstraction. Prefer clear, boring code over cleverness.
- Follow a consistent style (Prettier defaults). No custom lint rules without approval.

## 3) Testing
- Add/extend **unit tests** for core logic (derived values, targets, lock total, CSV parsing). Fast and isolated.
- Minimum: happy path + two edge cases per new utility.
- Don’t snapshot large trees unless there’s value. Prefer behaviour tests.

## 4) UX, a11y, and Performance
- Keep interactions responsive with **~1,000 rows**. Memoise derived selectors; avoid unnecessary re‑renders.
- Provide accessible labels for inputs/selects; keyboard navigation should work in the grid.
- Avoid heavy libraries for the grid unless approved. Start with lightweight components.

## 5) Security & Privacy
- **No network calls** in MVP. Everything is local‑first.
- Treat CSV import/export as explicit user actions. Don’t auto‑upload data anywhere.

## 6) Git Hygiene
- Commit messages: imperative mood, concise summary, optional body with rationale.
- Group related changes together; don’t mix refactors with feature work unless required.

## 7) Documentation
- Update README or inline docs when behaviour changes.
- Each task should end with a short **Change Summary** in the PR description: what changed, why, and any trade‑offs.

## 8) Prompt Discipline (for Codex)
- Always start tasks by **restating acceptance criteria** you will satisfy.
- If requirements are ambiguous, **ask first** and propose options.
- When a task is done, output: modified files list, a brief rationale, and any follow‑up tasks.

## 9) File Boundaries (initial guidance)
- **/src/state/** – state, selectors, persistence.
- **/src/components/** – UI components (grid, lists manager, summary cards).
- **/src/utils/** – pure functions (maths, CSV parsing).
- **/tests/** – unit tests for utils and selectors.

## 10) Performance Budget
- Typing in numeric cells should not stutter on mid‑range laptops. Aim for < 16ms per render.
- Prefer O(n) passes with memoisation over repeated ad‑hoc reductions.

---

### Quick Review Checklist (tick before merging)
- [ ] Scope adhered to; small, reviewable diff
- [ ] No new deps (or justified and approved)
- [ ] Types added/updated; utilities are pure & tested
- [ ] a11y labels & keyboard flow intact
- [ ] Performance considerations (memoisation, selectors)
- [ ] Docs/README updated where needed
- [ ] Clear change summary provided