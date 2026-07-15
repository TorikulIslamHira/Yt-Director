# yt-director — Strict Rules

Governing document for Main Task 1 (Frontend). Every screen, component, and PR must follow this. Decisions here are final unless explicitly revisited — do not silently deviate.

Stack: Next.js (App Router) + TypeScript (strict) + Tailwind CSS v4 + shadcn/ui (Radix primitives) + lucide-react + next-themes.

---

## 1. Design Tokens

### 1.1 Color Palette

All colors are CSS variables in `src/app/globals.css` (shadcn/ui token set + our extensions), consumed via Tailwind's `@theme inline`. Never hardcode a hex value in a component — reference the token (`bg-background`, `text-foreground`, `bg-primary`, etc.).

| Token | Light | Dark | Usage |
|---|---|---|---|
| `background` | `#FFFFFF` | `#0B1120` | page background |
| `card` | `#F8FAFC` | `#111827` | cards, panels, modals, popovers |
| `border` / `input` | `#E2E8F0` | `#1F2937` | dividers, card borders, input borders |
| `foreground` | `#0F172A` | `#F1F5F9` | primary text |
| `muted-foreground` | `#475569` | `#94A3B8` | secondary/help text |
| `primary` | `#2563EB` | `#3B82F6` | primary buttons, links, active states |
| `primary-foreground` | `#FFFFFF` | `#0B1120` | text/icon on primary |
| `secondary` | `#F1F5F9` | `#1E293B` | secondary button fill |
| `success` | `#16A34A` | `#22C55E` | success state, badges |
| `error` (alias of shadcn `destructive`) | `#DC2626` | `#EF4444` | error/destructive state |
| `warning` | `#D97706` | `#F59E0B` | warning state |

Status colors (`success`/`error`/`warning`) are used **only** to communicate state (badges, toasts, form validation) — never as decoration. Tint backgrounds are produced with Tailwind opacity modifiers (`bg-success/10`, `bg-error/10`, `bg-warning/10`), matching the existing `destructive` usage in the generated `button`/`badge` components — do not add separate `*-bg` tokens.

### 1.2 Typography

Two font families, both loaded via `next/font/google` (self-hosted, no external network calls at runtime):

- **English / UI (Latin)**: `Inter`
- **Bangla**: `Hind Siliguri`

Both are set as CSS variables and composed in a single `font-sans` stack so mixed Bangla+English text (e.g. a scene description) renders correctly without manual font-switching: `var(--font-inter), var(--font-hind-siliguri), sans-serif`.

Type scale (mobile-first; do not introduce ad-hoc sizes):

| Level | Size / Line-height | Weight | Tailwind |
|---|---|---|---|
| H1 | 32px / 40px | 600 | `text-3xl leading-10 font-semibold` |
| H2 | 24px / 32px | 600 | `text-2xl leading-8 font-semibold` |
| H3 | 20px / 28px | 600 | `text-xl leading-7 font-semibold` |
| H4 | 16px / 24px | 600 | `text-base leading-6 font-semibold` |
| Body | 14px / 20px | 400 | `text-sm leading-5 font-normal` |
| Caption | 12px / 16px | 400 | `text-xs leading-4 font-normal` |

Max 2 font weights on any single screen: `400` (normal) and `600` (semibold). Never use `700`/`800`/`900` or `300`/`200` weights.

### 1.3 Spacing & Grid

- Base unit: **4px**, i.e. Tailwind's default spacing scale (`1 = 4px`). Never use arbitrary pixel values (`p-[13px]`) — round to the nearest step in the scale.
- Container max-width: `1280px` (Tailwind `max-w-7xl`), centered with `mx-auto px-4 md:px-6`.
- Grid: 12-column conceptually; in practice use Tailwind's `grid-cols-*` with responsive breakpoints (see §1.5). Gutter: `gap-4` (16px) mobile, `gap-6` (24px) desktop.
- Card padding: minimum `p-4` (16px), section vertical rhythm: minimum `space-y-8` (32px) between major sections.

### 1.4 Core Component Library

Base: **shadcn/ui** (Radix primitives + Tailwind), customized to the tokens above. Do not hand-roll a component shadcn already provides.

Required base components before any screen work starts: `Button` (variants: `primary`, `secondary`, `ghost`, `destructive`), `Input`/`Textarea`, `Card`, `Badge`, `Skeleton` (loading), `Toast`/`Sonner` (notifications), `Dialog` (for Scene Detail modal).

Button rules:
- One `primary` button per screen/section — it must be the single visually dominant action.
- `destructive` variant only for irreversible actions (delete, discard).
- Never use raw `<button>` with ad-hoc Tailwind classes outside the shared `Button` component.

### 1.5 Responsive Rules

Decision: **fully responsive**, not desktop-first. Every screen must be usable on mobile — no screen is allowed to silently drop functionality on small viewports without an explicit, documented simplification.

Breakpoints: Tailwind defaults — `sm 640` `md 768` `lg 1024` `xl 1280` `2xl 1536`. Write base (mobile) styles first, layer `md:`/`lg:` on top — never the reverse.

Scene Review Dashboard grid: `grid-cols-1` (mobile) → `md:grid-cols-2` → `lg:grid-cols-3` → `xl:grid-cols-4`.

### 1.6 Iconography

- Library: **lucide-react** only. No mixing icon sets, no custom SVG icons unless lucide has no equivalent (check first).
- Size: `size-5` (20px) for inline/button icons, `size-6` (24px) for standalone icon-buttons.
- Stroke width: `1.75` (set globally via a shared `Icon` wrapper or per-instance `strokeWidth={1.75}`), never filled icons.
- An icon never replaces text without an accompanying `aria-label` or visible label.

### 1.7 Dark Mode

Decision: **required**, both palettes, system-preference-aware by default, user-toggleable.

- Implementation: `next-themes` with the `class` strategy (`darkMode: 'class'` behavior via `.dark` selector on `<html>`), not the `media`-query-only approach — this is what allows a manual toggle on top of system default.
- Every new color usage must have both a light and dark value defined as a token (§1.1) before use — no component-local dark-mode overrides.

### 1.8 Minimal Design Principle

1. **No shadows beyond `shadow-sm`.** Use `border` for separation, not elevation. Modals/popovers may use `shadow-md` at most.
2. **No gradients**, anywhere, on any screen. Flat fills only.
3. **One accent per view.** Don't combine primary + success + warning decoratively in the same section — status colors appear only where they carry meaning.
4. **Whitespace over borders where possible.** Prefer `space-y-*`/`gap-*` to visually separate content; add a border only when spacing alone is ambiguous.
5. **Content-first layout.** No decorative illustrations, stock photography, or hero art that doesn't convey real data or status.
6. **Two weights max** (see §1.2) — hierarchy comes from size and color, not boldness stacking.
7. **Every screen has exactly one primary action.** Everything else is `secondary` or `ghost`.
8. **Icons support text, they don't replace it** (see §1.6).

---

## 2. Screen/Flow Decisions Already Locked

- **Editing Guideline Viewer** (§1.2.7 of the original plan): **list style**, scene-by-scene, scrollable — not a visual timeline. Do not build a timeline UI for this screen.
- **Framework**: Next.js App Router (migrated from the initial Vite scaffold on 2026-07-15).

---

## 3. Coding Conventions

### Structure
```
src/
  app/                # routes only (App Router) — page.tsx, layout.tsx per route
  components/
    ui/                # shadcn primitives (Button, Card, Input, ...) — do not hand-edit generated internals beyond token wiring
    layout/            # site-wide chrome, not feature-specific: AppHeader, ThemeProvider, ThemeToggle
    <feature>/         # feature components, e.g. components/scene-review/SceneCard.tsx
  db/                  # sqlite/drizzle schema + client (server-only)
  lib/                 # server-only utils, validation, parsing, DB row mappers, shared helpers
    integrations/      # third-party API clients (Gemini, Loudly, Pexels/Pixabay) + their shared fetch-retry helper
    client/            # browser-only helpers (sessionStorage, Blob URLs, client fetch wrapper) — never imported from a route handler
  hooks/               # custom hooks
  types/               # shared TypeScript types
```

`lib/client/` vs `lib/`: anything that touches a browser-only API (`sessionStorage`, `Blob`, `URL.createObjectURL`) or is client-only demo data goes in `lib/client/`. Everything else in `lib/` (API clients, validation, parsing, DB row mappers) is server-only and must never be imported into a `"use client"` file.

`lib/integrations/` vs `lib/`: a file that calls an external third-party API (Gemini, Loudly, Pexels, Pixabay) goes in `lib/integrations/`, named after the service. Local-only server logic (validation schemas, script parsing, zip/guideline building, DB row mapping) stays flat in `lib/`.

### TypeScript
- `strict: true` (already on). Never use `any` — use `unknown` + narrowing, or a proper type.
- Exported functions/components have explicit return types when not immediately obvious from a `.tsx` return.

### Components
- One component per file. Filename matches the component name in `PascalCase.tsx`.
- Named exports for everything except `page.tsx`/`layout.tsx`/`loading.tsx`/`error.tsx` (Next.js requires default exports there).
- Server Components by default. Add `"use client"` only when the component needs state, effects, or browser-only APIs — push client boundaries as far down the tree as possible.

### Styling
- Tailwind utility classes only. No separate `.css`/`.module.css` files per component, no inline `style={}` unless the value is genuinely dynamic and can't be a class (e.g. a computed progress-bar width).
- Never hardcode a color hex in JSX/CSS — use the tokens in §1.1.

### State
- Local component state: `useState`/`useReducer`.
- Do not introduce a global state library (Zustand/Redux/etc.) preemptively — only add one when a concrete cross-screen state need appears in the 1.3 component-build phase, and only after confirming the need first.

### Language
- Bangla and English text can co-occur (e.g. scene descriptions). Rely on the combined font stack (§1.2) — don't manually switch fonts per string.

---

## 4. Change Control

This document is the source of truth for frontend decisions. If a new decision needs to be made (e.g. a new color, a new breakpoint behavior), it gets added here first, then implemented — not the other way around.
