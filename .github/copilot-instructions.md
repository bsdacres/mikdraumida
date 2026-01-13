# Mikdraumida - AI Coding Assistant Instructions

## Project Overview

**Mikdraumida** is a multi-package e-commerce monorepo built on **Medusa v2** (headless commerce framework). Three distinct frontends consume the same Medusa backend:
- **backend**: Medusa 2.12.3 commerce server with custom modules, workflows, and APIs
- **backend-storefront**: Next.js 15 + Tailwind storefront (main production frontend)
- **client**: SolidStart 1.1.0 experimental UI (alternative frontend, uses Bun)

### Development Commands

**Backend (Node 20+, TypeScript):**
```bash
cd backend
npm run dev          # Start Medusa development server (port 9000)
npm run build        # Build for production
npm run seed         # Run database seeding script
npm test:unit        # Run unit tests
npm test:integration:http  # Run HTTP integration tests
```

**Backend-Storefront (Next.js port 8000):**
```bash
cd backend-storefront
npm run dev          # Start with Turbopack
npm run build && npm start
npm run lint
```

**Client (SolidStart with Bun):**
```bash
cd client
bun run dev          # Start development server
bun run build
bun install          # Runs postinstall fix-imports script
```

## Architecture & Data Flow

### Backend Architecture (Medusa Framework)

Medusa follows a **modular, event-driven architecture**:

1. **Modules** (`/src/modules/`): Reusable, isolated business logic packages
   - Each module has: `models/`, `service.ts`, `index.ts`
   - Services extend `MedusaService` and encapsulate database queries
   - Example: `Product`, `Cart`, `Order` modules
   - **Add new module**: Create folder, define model, extend MedusaService, export Module definition, add to `medusa-config.ts`

2. **API Routes** (`/src/api/`): File-based REST endpoints
   - Pattern: `src/api/[scope]/[resource]/route.ts`
   - Export functions named after HTTP verbs: `GET`, `POST`, `PUT`, `DELETE`
   - Access modules via `req.scope` (Medusa container)
   - Example: `src/api/store/products/route.ts` → `GET /store/products`

3. **Workflows** (`/src/workflows/`): Multi-step orchestration for complex operations
   - Use `createStep()` for idempotent actions + `createWorkflow()` to compose
   - Steps auto-rollback on failure; execute from API routes or subscribers
   - Pattern: Import workflow, call `workflow(req.scope).run({ input })`

4. **Subscribers** (`/src/subscribers/`): Event-driven handlers
   - Listen to events (e.g., `product.created`, `order.placed`)
   - Receive `{ event: { data }, container }` in async function
   - Use `container.resolve()` to access module services

5. **Configuration** (`medusa-config.ts`):
   - Define module imports, database URL, JWT/cookie secrets, CORS origins
   - Environment variables: `DATABASE_URL`, `STORE_CORS`, `ADMIN_CORS`, etc.

### Frontend Data Layer Pattern

Both storefronts use **Medusa JS SDK** (`@medusajs/js-sdk`) + centralized server functions:

- **Backend-Storefront** (`src/lib/data/*.ts`):
  - "use server" functions for server-side data fetching
  - Each resource (products, cart, regions) has dedicated file
  - SDK instance in `src/lib/config.ts` with locale header interception
  - Caching via Next.js `revalidate`/`tags` for ISR

- **Client** (`src/lib/medusa.ts`):
  - SDK instance initialized with publishable key
  - Direct calls from Solid components

### Region & Localization

- **Multi-region support**: Middleware detects country code → region mapping
- **Backend-Storefront** `middleware.ts`: Caches region map (1-hour TTL), sets locale headers
- Storefronts use `[countryCode]` URL segments for routing

## Key Patterns & Conventions

### Database Queries (Backend)

**Pattern**: Never write raw SQL. Use Module Services with `MedusaService` methods:
```typescript
// In service.ts
class ProductService extends MedusaService({ Product, Variant }) {
  async getProductsByCategory(categoryId: string) {
    return this.query({ category_id: categoryId }, { relations: ["variants"] })
  }
}
```
Access via: `container.resolve("product").getProductsByCategory(id)`

### Error Handling (Backend)

- Medusa framework auto-catches and returns HTTP errors from services
- Use `MedusaError` or throw generic errors; status codes map automatically
- Validation happens in service layer, not routes

### Integration Tests

- Three test types: `unit`, `integration:http`, `integration:modules`
- Config in `jest.config.js` matches `TEST_TYPE` env var
- HTTP tests: `integration-tests/http/*.spec.ts`
- Module tests: `src/modules/*/__tests__/**/*.ts`
- Setup: `integration-tests/setup.js` loads environment

### Frontend Patterns

**Next.js Storefront:**
- Server components + "use server" for data, client components for interactivity
- Shared UI via `@medusajs/ui` + Tailwind (preset: `@medusajs/ui-preset`)
- Modules align with routes: `src/modules/products/`, `src/modules/checkout/`

**SolidStart Client:**
- Route-based: `src/routes/[...].tsx`
- Stripe integration via `solid-stripe` + `@stripe/react-stripe-js`
- Context API for state (e.g., `src/context/cart.tsx`)
- Bun package manager (lockfile: `bun.lockb`)

## Critical External Dependencies

- **@medusajs/framework v2.12.3**: Core commerce logic (modules, workflows, API)
- **@stripe/stripe-js**: Payment processing (both storefronts)
- **@medusajs/js-sdk**: Client-side Medusa API access
- **@medusajs/ui**: Headless UI components (Next.js storefront only)

## When Implementing Features

1. **Backend Logic**: Create module service method, expose via API route or workflow
2. **Frontend Data**: Create "use server" function in `src/lib/data/`, call from component
3. **Complex Operations**: Use workflow (multi-step, rollback support)
4. **Real-time Sync**: Use subscriber to trigger updates on business events
5. **Tests**: Add to corresponding `__tests__/` folder; run with `npm test:*` scripts

## Common Gotchas

- **Medusa 2.x Only**: This repo targets v2; many v1 docs are outdated
- **Node 20+ Required**: Backend requires Node 20+; Bun client needs Node 22+
- **CORS Configuration**: Storefronts connect to backend via `MEDUSA_BACKEND_URL`; set CORS in `medusa-config.ts`
- **Publishable Key**: Frontend SDK needs `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` for store routes
- **SolidStart Experimental**: Client uses SolidStart (Solid's framework); different from React patterns
