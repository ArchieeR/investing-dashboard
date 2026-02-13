# UI Design System: "Electric Future"

**Status:** Draft | **Theme:** High-Contrast Modern

## 1. Core Philosophy
1.  **Mobile First:** All interfaces must be designed for 375px width first, then expand to 1024px+.
2.  **High Contrast:** Use deep blacks/blues and bright accents. No washed-out pastels.
3.  **Flexibility:** The top navbar allows for infinite vertical scroll without sidebar constraints on mobile.

## 2. Color Palette

### The "Electric Blue" Accent
*   **Usage:** Primary buttons, active states, key data highlights.
*   **Hex:** `#2563EB` (Tailwind Blue-600) for standard, `#3B82F6` (Blue-500) for dark mode pop.

### Theme A: "Deep Ocean" (Dark Mode) - *Default*
*   **Background:** `#020617` (Slate 950) - *Not pitch black, but a rich, deep navy.*
*   **Surface (Cards):** `#0F172A` (Slate 900).
*   **Text Main:** `#F8FAFC` (Slate 50).
*   **Text Muted:** `#94A3B8` (Slate 400).
*   **Border:** `#1E293B` (Slate 800).

### Theme B: "Clean Slate" (Light Mode)
*   **Background:** `#F8FAFC` (Slate 50) or `#FFFFFF` (White).
*   **Surface (Cards):** `#FFFFFF` (White) with subtle shadow.
*   **Text Main:** `#0F172A` (Slate 900).
*   **Text Muted:** `#64748B` (Slate 500).
*   **Border:** `#E2E8F0` (Slate 200).

## 3. Layout Strategy

### The Top Navbar (The "Hanging Garden")
Instead of a side sidebar (which eats width), we use a **Sticky Top Navbar**.
*   **Height:** `h-16` (64px).
*   **Z-Index:** `z-50` (Always on top).
*   **Content:** Logo (Left), Context/Search (Middle), Profile/Theme Toggle (Right).
*   **Mobile:** Right-side Hamburger menu triggers a `Sheet` (Shadcn) drawer.

### The Responsive Grid
*   **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
*   **Dashboard Grid:**
    *   **Mobile:** 1 Column (`grid-cols-1`).
    *   **Tablet:** 2 Columns (`grid-cols-2`).
    *   **Desktop:** 3 or 4 Columns (`grid-cols-4`).

## 4. Typography
*   **Font Family:** **Inter** (Sans-serif).
    *   *Note:* Ensure `next/font/google` is configured for Inter in `layout.tsx`.
*   **Weights:**
    *   **Headings:** `font-semibold` or `font-bold` (Tracking tight).
    *   **Body:** `font-normal`.
    *   **Data/Numbers:** `font-mono` (for tickers and prices).

## 5. Shape & Radius (The "Premium Slick" Look)
*   **Philosophy:** Avoid "bubbly" or "friendly" large curves. We want precise, technical, and high-end.
*   **Global Radius:** `0.3rem` (approx 5px).
*   **Tailwind Class:** Default to `rounded-md` or `rounded-sm`.
*   **Prohibited:** Avoid `rounded-xl` or `rounded-2xl` and `rounded-full` (except for pills/avatars).
*   **Borders:** Thin, crisp `1px` borders (`border border-border`) are preferred over heavy shadows.

## 6. Iconography
*   **Library:** `lucide-react` (Standard).
*   **Philosophy:** **Strategic & Functional.** Use icons for navigation, triggers (e.g., "Edit", "Search"), and status indicators.
*   **Constraint:** Do **not** use icons purely for decoration. Every icon must serve a clear purpose to reduce visual clutter.
*   **Style:** Stroke width `1.5` or `2` (Keep consistent).
