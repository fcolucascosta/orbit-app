# CODEBASE.md - Orbit App

> **Documentation for AI Agents & Developers**
> This file describes the architecture, stack, and conventions of the Orbit App.

---

## 🏗️ Technology Stack

- **Framework**: Next.js 16.1.0 (App Router, Turbopack)
- **Language**: TypeScript (^5)
- **Styling**: 
  - Tailwind CSS v4
  - Shadcn UI (Radix UI primitives in `components/ui`)
  - Icons: Lucide React
- **Backend / Data**: 
  - Supabase (PostgreSQL, Auth, Realtime)
  - `@supabase/ssr` for Server-Side Rendering auth
- **State & Validation**:
  - React Hook Form + Zod (Schema Validation)
  - `date-fns` (Date manipulation)
  - `sonner` (Toast notifications)

---

## 📂 Directory Structure

```plaintext
orbit-app/
├── .agent/              # Ag-Kit Configuration (Agents, Rules, Skills)
├── app/                 # Next.js App Router (Pages, Layouts)
│   ├── auth/            # Authentication routes (Login, Signup)
│   ├── habit/           # Feature: Habit tracking
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
├── components/          # React Components
│   ├── ui/              # Shadcn/Radix UI Primitives (Atomic)
│   └── ...              # Feature-specific components
├── lib/                 # Shared logic & Utilities
│   ├── supabase/        # Supabase client & proxy setup
│   └── utils.ts         # Tailwind merger (cn helper)
├── public/              # Static assets
└── middleware.ts        # Auth protection (Delegates to lib/supabase/proxy)
```

---

## 🧩 Key Patterns & Architecture

### 1. Authentication (Supabase)
- **Middleware**: Protected routes are guarded by `middleware.ts`, which uses `updateSession` from `@/lib/supabase/proxy`.
- **Client/Server**: Uses `@supabase/ssr` to handle sessions across Server Components and Client Components safely.

### 2. Styling System
- **Tailwind v4**: Uses the new CSS-first configuration (`index.css` or embedded).
- **Shadcn UI**: Components are installed in `components/ui/`. DO NOT modify these unless necessary for theming. Use `cn()` for overrides.
- **Theme**: Supports dark/light mode via `next-themes`.

### 3. Data Fetching
- **Server Components**: Fetch data directly from Supabase DB in `page.tsx` or `layout.tsx` where possible.
- **Server Actions**: Use Server Actions for mutations (form submissions) to ensure type safety and security.

---

## ⚠️ Development Rules (Agent Instructions)

- **Next.js 16**: Be aware of Canary features/deprecations (e.g., `middleware` vs `proxy`).
- **Imports**: Always use absolute imports `@/` (e.g., `@/components/ui/button`).
- **Type Safety**: strict TypeScript. No `any`.
- **Component Placement**:
  - "Dumb" UI components -> `components/ui`
  - "Smart" feature components -> `components/<feature>` or `app/<feature>/_components`
