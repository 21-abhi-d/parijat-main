# Parijat — Build Roadmap

Tick off items as they are completed. See `docs/PLAN.md` for detailed design decisions behind each step.

---

## Phase 1 — Foundation

### 1.1 Dependencies & Environment
- [x] Install all production dependencies (mongoose, @auth/mongodb-adapter, bcryptjs, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, resend, twilio, react-hook-form, @hookform/resolvers, lucide-react, class-variance-authority, clsx, tailwind-merge)
- [x] Install dev dependencies (tsx, @types/bcryptjs) — vitest + playwright deferred to Phase 4
- [x] Create `.env.example` with all required variables
- [x] Update `src/env.js` with full t3-env validation for all variables

### 1.2 Database
- [x] `src/server/db/client.ts` — Mongoose singleton
- [x] `src/server/db/mongo-client.ts` — raw MongoClient for NextAuth adapter
- [x] `src/server/db/models/product.model.ts`
- [x] `src/server/db/models/customer.model.ts`
- [x] `src/server/db/models/inventory-log.model.ts`
- [x] `src/server/db/models/notification.model.ts`

### 1.3 Auth
- [x] Replace Discord provider with Google OAuth in `src/server/auth/config.ts`
- [x] Add `@auth/mongodb-adapter`, set `strategy: "database"`
- [x] Augment session type with `id` and `role`
- [ ] Add Resend magic link provider (deferred — needs RESEND_API_KEY)
- [ ] `scripts/seed-admin.ts`
- [ ] `scripts/hash-password.ts`

### 1.4 tRPC
- [x] Add `adminProcedure` to `src/server/api/trpc.ts`
- [x] `src/server/api/routers/catalog.router.ts`
- [x] `src/server/api/routers/product.router.ts`
- [x] `src/server/api/routers/customer.router.ts`
- [x] `src/server/api/routers/inventory.router.ts`
- [x] `src/server/api/routers/notification.router.ts`
- [x] `src/server/api/routers/admin.router.ts`
- [x] `src/server/api/routers/uploads.router.ts` (stubbed — needs Phase 1.5 storage service)
- [x] Wire all routers into `src/server/api/root.ts`

### 1.5 Services
- [x] `src/server/services/storage/storage.interface.ts`
- [x] `src/server/services/storage/s3-storage.service.ts`
- [x] `src/server/services/inventory/inventory.interface.ts`
- [x] `src/server/services/inventory/mongo-inventory.service.ts`
- [x] `src/server/services/notification/notification.interface.ts`
- [x] `src/server/services/notification/email.service.ts` (Resend)
- [x] `src/server/services/notification/notification.service.ts` (orchestrator)
- [ ] `src/server/services/notification/sms.service.ts` (Twilio — deferred)

### 1.6 Middleware & Route Protection
- [x] `src/middleware.ts` — protect `/admin/*` and `/account/*`

### 1.7 Validators
- [x] `src/lib/validators/product.schema.ts`
- [x] `src/lib/validators/customer.schema.ts`
- [x] `src/lib/validators/inventory.schema.ts`
- [x] `src/lib/validators/notification.schema.ts`

---

## Phase 2 — Admin Dashboard

- [ ] Install and configure shadcn/ui
- [ ] `src/lib/theme.ts` — central colour/font tokens
- [ ] `src/app/(admin)/layout.tsx` — sidebar layout, role re-check
- [ ] `src/app/(admin)/admin/page.tsx` — overview stats
- [ ] Product management: list, create, edit, delete (`/admin/products`)
- [ ] `src/components/shared/ImageUpload.tsx` — presigned S3 upload component
- [ ] Inventory management: stock table, inline edit, log history (`/admin/inventory`)
- [ ] Customer list with notification opt-in counts (`/admin/customers`)
- [ ] Notification composer + sent log (`/admin/notifications`)
- [ ] Bookings placeholder page (`/admin/bookings`)

---

## Phase 3 — Storefront

- [ ] `src/app/(shop)/layout.tsx` — Navbar, Footer
- [ ] `src/components/layout/Navbar.tsx`
- [ ] `src/components/layout/Footer.tsx`
- [ ] Home/landing page (`/`)
- [ ] Catalog page with client-side filter + search (`/catalog`) — **most important page**
  - [ ] `CatalogGrid`, `ProductCard`
  - [ ] `FilterPanel` (category, type, colour, price, stock) — drawer on mobile, sidebar on desktop
  - [ ] `SearchBar` (debounced, searches name/code/type/colour)
  - [ ] `ActiveFilters` chips
- [ ] Product detail page (`/products/[slug]`) — image gallery + BookingCTA
- [ ] Booking page with Cal.com embed + product prefill (`/booking`)
- [ ] Events/announcements page (`/events`)
- [ ] Customer account + notification preferences (`/account`)
- [ ] Cart placeholder (`/cart`) — no Stripe logic, UI stub only
- [ ] Auth pages (`/auth/signin`, `/auth/error`)

---

## Phase 4 — Testing

- [ ] Configure Vitest (`vitest.config.ts`, `tests/setup.ts`)
- [ ] Unit tests: inventory service, notification service, validators
- [ ] Configure Playwright (`playwright.config.ts`)
- [ ] E2E tests: catalog browse, booking flow, admin product CRUD

---

## Phase 5 — Deployment

- [ ] `Dockerfile` for Next.js app
- [ ] GitHub Actions CI: lint + typecheck + test on PR
- [ ] GitHub Actions CD: build image → push to ECR → deploy to ECS
- [ ] AWS infrastructure: ECS Fargate, ALB, CloudFront (app + assets), S3, ACM, Secrets Manager
- [ ] MongoDB Atlas: production cluster, VPC peering

---

## Deferred (do not implement until explicitly requested)

- Stripe payments (cart, checkout, payment intents)
- Cal.com webhook / booking mirroring to MongoDB
