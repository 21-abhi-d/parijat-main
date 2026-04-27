# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Parijat** is a Next.js 15 (App Router) e-commerce and consultation booking site for a physical Indian traditional wear boutique. It replaces social media as the primary product discovery channel. The full technical plan is in `docs/PLAN.md`.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run check        # lint + typecheck together
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint via Next.js
npm run lint:fix     # ESLint with auto-fix
npm run format:write # Prettier (format all files)
npm run format:check # Prettier (check only)
```

Scripts (to be added):
```bash
npm run seed:admin                             # Seed admin user
npx tsx scripts/hash-password.ts <password>   # Generate bcrypt hash for ADMIN_PASSWORD_HASH
```

Tests (Vitest + Playwright not yet configured):
```bash
npm run test         # unit/integration tests (Vitest)
npm run test:e2e     # Playwright E2E
npx vitest run tests/unit/services/inventory.service.test.ts  # single file
```

## Environment

Copy `.env.example` → `.env` once it is created. Key variables to add:
- `AUTH_SECRET` — `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `MONGODB_URI`, `CLOUDFRONT_URL`, `S3_BUCKET_NAME`
- `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`
- `NEXT_PUBLIC_CALCOM_LINK`

## Current State (T3 Scaffold)

The codebase is a freshly generated T3 scaffold. What exists:
- `src/server/api/trpc.ts` — `publicProcedure` and `protectedProcedure` only (`adminProcedure` not yet added)
- `src/server/auth/config.ts` — Discord provider (T3 default, **must be replaced** with Resend magic link + Google OAuth)
- `src/server/api/root.ts` — only the T3 example `post` router (to be replaced)
- `src/trpc/react.tsx`, `src/trpc/server.ts`, `src/trpc/query-client.ts` — tRPC client wiring (keep as-is)

Everything else described below is the **target architecture** to be built per `docs/PLAN.md`.

## Target Architecture

### Route Groups

- `src/app/(shop)/` — public storefront: home, catalog, product detail, booking, events, account, cart (placeholder for future Stripe)
- `src/app/(admin)/` — admin dashboard, gated to `role: "admin"`
- `src/middleware.ts` — enforces `/admin/*` → admin role, `/account/*` → any session
- Admin layout re-checks role as defence-in-depth

### tRPC API

Handler at `src/app/api/trpc/[trpc]/route.ts`. Router root: `src/server/api/root.ts`.

Three procedure types to have in `src/server/api/trpc.ts`:
- `publicProcedure` — no auth (exists)
- `protectedProcedure` — any valid session (exists)
- `adminProcedure` — `role: "admin"` required, throws FORBIDDEN (to be added)

Target routers: `catalog`, `product`, `customer`, `inventory`, `notification`, `admin`, `uploads` (S3 presign).

Client-side tRPC: `src/trpc/react.tsx`. Server-side caller: `src/trpc/server.ts`.

### Database

- `src/server/db/client.ts` — Mongoose singleton connection
- `src/server/db/mongo-client.ts` — raw MongoClient for NextAuth adapter
- Models in `src/server/db/models/`: `product`, `customer`, `inventory-log`, `notification`

**Critical data rule:** The Product model holds both public and internal fields in one collection. tRPC catalog/product routers must select only public fields (`slug`, `code`, `name`, `category`, `type`, `colour`, `priceAUD`, `stockStatus`, `images`). Fields like `vendor`, `priceINR`, `costINR`, `costAUD`, `estimatedSalePrice` are internal only — must never be returned by customer-facing procedures.

### Auth

NextAuth v5 with two providers: **Resend magic link** (customers + admin) and **Google OAuth** (customers). Sessions stored in MongoDB via `@auth/mongodb-adapter` (`strategy: "database"`). Admin accounts seeded via `scripts/seed-admin.ts`.

### Services (interface → implementation pattern)

- `src/server/services/inventory/` — abstracted behind `IInventoryService` to allow future POS/vendor integrations
- `src/server/services/notification/` — orchestrator dispatches to `email.service.ts` (Resend) and `sms.service.ts` (Twilio)
- `src/server/services/storage/` — `IStorageService` → `s3-storage.service.ts`

### Image Uploads

Admin uploads via presigned S3 PUT URLs (`uploads.presignUrl` tRPC mutation). Browser uploads directly to S3 — no server proxying. Served via CloudFront. Key format: `products/{productId}/{uuid}.{ext}`.

### Booking (Cal.com)

Product code/name passed to Cal.com as a prefilled field via `?product={slug}` URL param. Cal.com owns all booking data — no webhook, no MongoDB mirroring.

### Frontend

- Component library: shadcn/ui on Tailwind CSS
- Central theme: `src/lib/theme.ts` — orange/white colour tokens, swap-friendly when brand assets arrive
- Catalog page is the most important: client-side filter + search over all products fetched on load (100–200 SKUs)
- Zod schemas in `src/lib/validators/` shared between tRPC input validation and react-hook-form

### What Must Not Be Implemented Yet

- **Stripe** — do not add any Stripe logic until explicitly requested; stub the `/cart` route only
- **Cal.com webhook** — do not mirror booking data to MongoDB
