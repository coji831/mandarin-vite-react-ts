# Frontend Modular Monolith vs Micro Frontend

**KB Category:** Architecture Patterns
**Last Updated:** June 13, 2026

Yes, your current structure is actually the exact frontend equivalent of a Modular Monolith! In the frontend world, this pattern is widely known as a **Feature-Driven Architecture** (or Domain-Driven Frontend Design).

Your separation of `pages/` (orchestration/routing) and `features/` (isolated business modules) perfectly mirrors the backend API setup we discussed.

Here is how your structure maps to the backend concepts, how easy it will be to transition to Micro-frontends, and the industry best practices to make that transition seamless.

---

## 1. The Frontend "Modulith" Blueprint

To make your frontend structure as robust as your backend, you should adopt a similar 3-layer approach by adding a dedicated `shared/` layer.

```text
src/
├── app/                    # Global entry point (Main providers, global styles)
├── pages/                  # Routers & Layout Orchestrators (The "Controllers")
│   ├── OrdersPage.tsx      # Imports from features/orders
│   └── CatalogPage.tsx     # Imports from features/catalog
│
├── features/               # The "Modules" (Strictly isolated by domain)
│   ├── orders/
│   │   ├── components/     # Internal UI components (e.g., OrderRow.tsx)
│   │   ├── hooks/          # Domain state/fetching (e.g., usePlaceOrder.ts)
│   │   └── index.ts        # The Public API (Only export what pages need)
│   └── catalog/
│
└── shared/                 # The Technical Foundation (No business logic)
    ├── components/         # Design System Atoms (Button, Input, Modal)
    ├── api/                # Base Axios/Fetch client with auth interceptors
    └── utils/              # Date formatters, local storage wrappers

```

---

## 2. Is this easy to transition to Micro-frontends (MFE) later?

**Yes, incredibly easy—provided you enforce one golden rule right now.**

Your `features/` folders are essentially proto-micro-frontends. If you decide tomorrow that the `orders` team needs to deploy their code independently using a Micro-frontend framework (like **Module Federation** or **Single-SPA**), the migration path is straightforward because the domain logic is already encapsulated.

### The Golden Rule: Absolutely No Cross-Feature Imports

Just like backend modules cannot query each other's databases, frontend features should never import directly from each other's internal folders.

- ❌ **Bad:** `features/orders/Component.tsx` imports from `features/catalog/components/ProductCard.tsx`
- **Good:** If `orders` needs a product card, that card should either be generic enough to live in `shared/components/` or the data should be passed down via props from the `page` level.

---

## 3. Industrial Best Practices for Frontend Moduliths

If you want to keep your frontend clean, scalable, and genuinely ready to break into micro-frontends later, adopt these industry standards:

### A. The `index.ts` Barrel File (Your Module "Public API")

Every folder inside `features/your-feature/` should have a single entry point file: `index.ts`. This file explicitly defines what the rest of the application is allowed to see.

```typescript
// src/features/orders/index.ts

// 👍 ALLOWED: Public components and hooks for Pages to consume
export { OrdersDashboard } from "./components/OrdersDashboard";
export { useOrderHistory } from "./hooks/useOrderHistory";

// 🔒 HIDDEN: Internal components (like OrderSecretRow.tsx) are NOT exported here.
```

If a developer tries to import an internal file directly (e.g., `import X from 'features/orders/components/internal/SecretRow'`), it is an architectural violation.

### B. Enforce Boundaries Automatically with ESLint

Don't rely on developers remembering the rules. Use **ESLint** (specifically `eslint-plugin-import` or tools like **Nx/Develocity** if using a monorepo) to throw compile-time errors if a feature tries to import from another feature.

Example ESLint configuration concept:

```json
"no-restricted-imports": ["error", {
  "patterns": [{
    "group": ["**/features/*/**"],
    "message": "Move shared logic to the shared/ directory or pass via props. Cross-feature imports are forbidden."
  }]
}]

```

### C. Feature-Owned State vs. Global State

A massive trap in frontend development is putting everything into a single, global Redux or Zustand store. This tangles your features together permanently.

- **Best Practice:** Keep state local to the feature. Use tools like **TanStack Query (React Query)** or **RTK Query** inside the feature's `hooks/` folder to manage server data caching.
- If features _must_ share state (like global user theme or auth), that state slice belongs in `shared/store/`, not inside individual features.

### D. Smart vs. Dumb Components

- **Features** own the **Smart Components**: They know about data fetching, business logic, API calls, and domain formatting.
- **Shared** owns the **Dumb Components**: Buttons, inputs, tables, and loaders. They take raw data via props, emit events via callbacks, and have absolutely no idea what an "Order" or "Product" is.

---

## Summary

Your current intuition is spot on. By continuing down this path—and reinforcing it with a dedicated `shared/` layer and strict `index.ts` boundary exports—you are building a frontend that can easily scale to millions of users as a single app, or be cleanly chopped up into independent Micro-frontends over a single weekend if your team scales out.
