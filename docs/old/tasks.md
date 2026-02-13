

# Task List (MVP) — Portfolio Manager

> **Owner:** You (keep this short & ordered). **Executor:** Codex (expand each task into subtasks and implement).  
> **How Codex should work:**
> 1) Read `docs/spec.md` and `docs/rules.md`.
> 2) Restate which **Acceptance Criteria** (spec §13) the task will satisfy.
> 3) Expand the chosen task into ≤5 subtasks and implement step‑by‑step.
> 4) Output a **change summary** (files touched, rationale, tests) per rules.

---

## Milestone 1 — Foundations
- [ ] **T1: Project scaffold**  
  Create base app structure and folders: `/src/state`, `/src/components`, `/src/utils`, `/tests`. Add minimal README. No external deps beyond React/TS/Tailwind/shadcn (if already chosen).  
  *ACs: basic app boots; folders exist; README quick start present.*

- [ ] **T2: Types & state shape**  
  Implement TypeScript types & app state per spec §6. Include selectors for derived values (total, %OfTotal, breakdowns). Stub persistence (localStorage).  
  *ACs: types compile; selectors tested; state persisted locally.*

- [ ] **T3: Pure utilities**  
  Add utils for maths & CSV: `value(price,qty)`, `%OfTotal`, target delta, cash‑buffer maths; CSV parse/stringify per spec §8.  
  *ACs: unit tests for happy path + 2 edge cases each; no UI work yet.*

---

## Milestone 2 — Core Grid
- [ ] **T4: Holdings grid (read/CRUD)**  
  Render table with columns from spec §5 (FR1). Inline editors for categorical/text fields; numeric inputs for price/qty/value. Add add/duplicate/delete row.  
  *ACs: grid renders; rows add/remove; editing updates state.*

- [ ] **T5: Two‑way editing**  
  Implement `price×qty=value` with editable **Value** that back‑solves **Qty** (price>0). Display rounded to 2 dp; store full precision.  
  *ACs: matches **AC1**; unit tests for calc utils already cover edge cases.*

- [ ] **T6: Include toggle**  
  Implement `include` column; excluded rows are ignored by totals/%/targets/breakdowns.  
  *ACs: matches **AC2**.*

- [ ] **T7: Targets & delta**  
  Add `targetPct` input and derived `£` + `%` delta vs target share of total.  
  *ACs: matches **AC3**.*

---

## Milestone 3 — Controls & Summaries
- [ ] **T8: Filters**  
  Dropdown filters for Section/Account/Theme. Filters affect grid view; summaries still reflect total of included rows (note current filters).  
  *ACs: matches **FR5**; grid filtered; summaries reconcile to total (AC7).* 

- [ ] **T9: Summaries/Breakdowns**  
  Three cards: By Section, By Account, By Theme. Show value + % descending.  
  *ACs: matches **FR6** and **AC7**.*

- [ ] **T10: Lists manager**  
  CRUD for Sections, Themes, Accounts (unique per list).  
  *ACs: matches **FR10**; lists drive editors & filters.*

---

## Milestone 4 — Power Features
- [ ] **T11: Playground Mode**  
  Snapshot/restore behaviour. Toggle on → capture snapshot; Restore; Toggle off → commit.  
  *ACs: **AC5**.*

- [ ] **T12: Lock Total (Cash buffer)**  
  Maintain a single `Cash buffer` row (price=1) that auto‑adjusts so portfolio total equals locked value within ±£0.01. Auto‑create the buffer if missing.  
  *ACs: **AC4**.*

- [ ] **T13: CSV import/export**  
  Export with header per spec; import robustly with defaults & boolean parsing.  
  *ACs: **AC6**; round‑trip import reproduces equivalent portfolio (IDs may differ).* 

---

## Milestone 5 — Multi‑Portfolio & Polish
- [ ] **T14: Multi‑portfolio switch**  
  Support at least two portfolios (Mine, Mum’s) with separate holdings/settings; optional shared lists.  
  *ACs: matches **FR11**; switching works without data loss.*

- [ ] **T15: Perf & a11y pass**  
  Memoise selectors, minimise re‑renders, keyboard nav across grid, labels for inputs/selects.  
  *ACs: **AC8** + a11y labels present.*

- [ ] **T16: Docs & tidy**  
  Update README (quick start, CSV format), add brief dev notes; ensure tests green.  
  *ACs: docs up to date; tests pass.*

---

## How to run a task (prompt for Codex)
```
Read docs/spec.md and docs/rules.md.
Take task <ID>. Restate the spec acceptance criteria you’ll satisfy.
Expand into ≤5 subtasks. Implement step-by-step.
When done, output modified files, a short change summary, and any follow-ups.
```