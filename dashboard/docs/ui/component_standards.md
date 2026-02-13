# design-system/component-standards

# Component Architecture Standards

To maintain a scalable and organized codebase, we follow a strict separation between **System Components** (generic UI) and **Feature Components** (domain logic).

## 1. Directory Structure

```
src/
├── components/
│   ├── ui/               # [SYSTEM] Generic Radix/Shadcn primitives (Buttons, Inputs)
│   ├── modules/          # [FEATURE] Domain-specific component bundles
│   │   ├── intelligence/ # e.g., ETF Search, Poller Status
│   │   ├── dashboard/    # e.g., Allocation Chart, Holdings Table
│   │   └── navigation/   # e.g., Sidebar, Topbar
│   └── layouts/          # [SHELL] Global wrappers and page shells
```

## 2. The Rules

### Rule #1: The "Legos vs. Castles" Principle
*   **System Components (`components/ui`)** are **Legos**. They are dumb, flexible, and don't know about "ETFs" or "Users". They only know about "variants", "sizes", and "onClick".
*   **Feature Components (`components/modules`)** are **Castles**. They are built using Legos. They communicate with the backend, fetch data, and contain business logic.

### Rule #2: Co-location for Page-Specific Items
If a component is *only* used on **one specific page** and is not reusable, define it inside that page's directory if using Next.js App Router:
*   `src/app/dashboard/_components/DashboardHeader.tsx`

However, **default to `components/modules/`** for anything that might be reused or is complex enough to deserve its own folder.

### Rule #3: Shadcn & Radix First
*   Do not build a customized dropdown from scratch. Use the `ui/` primitive.
*   Do not write raw CSS if a Tailwind utility class can do it.

## 3. Naming Conventions
*   **System:** Simple nouns. `Button`, `Card`, `Input`.
*   **Feature:** Specific descriptive names. `EtfSearchInput`, `HoldingsTable`, `SidebarNav`.
