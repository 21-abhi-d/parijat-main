# Parijat — Development Journal

A running log of decisions, findings, mistakes, and lessons learned. Most recent entries at the top.

---

## Log Format

```
### [YYYY-MM-DD] Short title
**Type:** Decision | Finding | Mistake | Fix
**Phase:** 1.1 / 1.2 / etc.
Body: what happened, why, and what to do differently.
```

---

### [2026-04-25] SMS/Twilio removed — email-only notifications
**Type:** Decision
**Phase:** 1.5 (retroactive)

Removed all Twilio/SMS code: `sms.service.ts` deleted, `NotificationChannel` type collapsed to `"email"` only, `notifications.sms` field removed from `CustomerModel`, channel input removed from `sendNotificationSchema` and `getRecipientCountSchema`. `env.js` Twilio vars removed. Rationale: boutique scale — email covers the real use case; SMS can be added as a discrete feature when needed. Having a full SMS path wired up with no credentials and no UI creates confusion and dead branches.

### [2026-04-24] Phase 1.7 complete — validators extracted
**Type:** Decision
**Phase:** 1.7

- Four Zod schemas created in `src/lib/validators/`: `product.schema.ts`, `customer.schema.ts`, `inventory.schema.ts`, `notification.schema.ts`.
- All inline schemas removed from routers (`product`, `customer`, `inventory`, `notification`). Routers now import types and schemas from validators — same source of truth for tRPC input validation and future react-hook-form usage.
- `z` import dropped from routers that no longer use it directly. `inventory.router.ts` retains `z` for the single-field `getStock` input (`z.object({ productId: z.string() })`), which is too trivial to warrant its own named schema.

---

### [2026-04-20] Phase 1.6 complete — middleware + auth strategy change
**Type:** Decision + Mistake
**Phase:** 1.6

- Changed `session.strategy` from `"database"` to `"jwt"`. Database sessions require a MongoDB call to verify — MongoDB cannot run on Next.js Edge runtime (where middleware executes). JWT sessions are verified cryptographically on Edge with no DB call. MongoDB adapter still creates user + account documents on sign-in.
- `declare module "next-auth/jwt"` augmentation fails in next-auth@5.0.0-beta.25 — that module path does not exist in this version. Removed augmentation; cast `token.role` inline as `"customer" | "admin" | undefined` instead.
- Middleware checks authentication only (redirect to `/auth/signin` if no session). Admin role check is done server-side in the admin layout — that is the correct layer for role enforcement since it has full DB access.
- `callbackUrl` is passed to the sign-in URL so users are redirected back after signing in.

### [2026-04-20] Phase 1.5 complete — services layer
**Type:** Finding + Mistake
**Phase:** 1.5

- `StockStatus` type is defined in `product.model.ts`, not `inventory-log.model.ts`. Incorrectly imported from the log model in both interface and implementation files. Fixed by importing from the correct source. Rule: types shared across models should be checked at the model level before importing.
- Both Resend and Twilio clients are lazily instantiated (created on first use, not at module load). This prevents startup crashes when `RESEND_API_KEY` / Twilio credentials are not yet configured.
- `inventory.router.ts` refactored to delegate to `inventoryService` — direct model calls removed. The service layer now owns all stock mutation logic including audit logging.

### [2026-04-20] `??` vs `||` operator mistake — uploads.router.ts
**Type:** Mistake + Fix
**Phase:** 1.5

Used `!env.S3_BUCKET_NAME ?? !env.CLOUDFRONT_URL` — TypeScript error TS2869: right operand of `??` is unreachable because `!env.S3_BUCKET_NAME` is always boolean (never null/undefined). Fixed to `||`.

Rule: use `??` for nullish coalescing (null/undefined only), use `||` for falsy checks (boolean, empty string, 0, null, undefined).

### [2026-04-20] Phase 1.4 complete — tRPC routers
**Type:** Decision + Finding
**Phase:** 1.4

- T3 scaffold's example `post` router and related components (`src/app/page.tsx`, `src/app/_components/post.tsx`) still referenced `api.post.*` after the router was deleted. Replaced both with minimal placeholders — caught by typecheck, not at runtime.
- `notification.router.ts` send procedure has a TODO stub for actual dispatch — logs the notification record but doesn't call Resend/Twilio yet. Will be wired to the notification service in Phase 1.5.
- `uploads.router.ts` presignUrl throws `NOT_IMPLEMENTED` until the S3 storage service is built in Phase 1.5.
- Inline Zod schemas used in routers for now — will be extracted to `src/lib/validators/` in Phase 1.7.
- `adminProcedure` throws `UNAUTHORIZED` (no session) or `FORBIDDEN` (wrong role) — two distinct error codes match what the frontend needs for redirect vs. denial UX.

### [2026-04-20] Phase 1.3 — Auth config (Google OAuth + MongoDB adapter)
**Type:** Finding + Decision
**Phase:** 1.3

- `@auth/mongodb-adapter@3.11.x` declares `mongodb@^6` as a peer dependency but mongoose@9 ships mongodb@7. Added `legacy-peer-deps=true` to `.npmrc` to resolve this. The adapter works fine at runtime with mongodb@7 — the API surface it uses (collections, sessions) hasn't changed.
- Made AWS, Resend, Twilio, Cal.com env vars optional in `src/env.js` so the app can start without those services configured. They will be tightened back to required when each service is implemented.
- Resend magic link provider deferred — will be added to `authConfig.providers` once `RESEND_API_KEY` is set.
- Session strategy set to `"database"` — sessions stored in MongoDB `sessions` collection. Enables immediate revocation. Trade-off: one DB read per authenticated request.
- `role` defaults to `"customer"` if not set on the user document. Admin role must be seeded manually via `scripts/seed-admin.ts` (not yet written).

### [2026-04-07] Phase 1.2 complete — database layer
**Type:** Decision
**Phase:** 1.2

- Exported `PUBLIC_PRODUCT_FIELDS` constant from `product.model.ts` — a single string listing all customer-safe fields for use in `.select()` calls. Centralising this means if a field is ever added/removed, there's one place to update.
- `InventoryLog` uses `{ timestamps: { createdAt: true, updatedAt: false } }` — logs are immutable records, no updatedAt needed.
- `mongoose.models.X ?? mongoose.model(...)` pattern on every model prevents Next.js hot-reload from throwing "Cannot overwrite model once compiled" errors in dev.
- MONGODB_URI updated to include `/parijat` database name and `retryWrites=true&w=majority` options — the T3 default connection string from Atlas omits these.

### [2026-04-07] Phase 1.1 complete — deps + env
**Type:** Finding
**Phase:** 1.1

- Installed in batches (db/auth → AWS → notifications → UI → dev) to isolate any install failures.
- Node v23.1.0 triggers an `EBADENGINE` warning for `eslint-visitor-keys@5.0.1` (requires `^20.19.0 || ^22.13.0 || >=24`). This is a transitive eslint dev dep — does not affect the app at runtime. Safe to ignore.
- `@auth/mongodb-adapter` is ESM-only — `require()` fails but ESM import works fine. The project is `"type": "module"` so this is expected.
- Kept `vitest` and `@playwright/test` out of Phase 1.1 — they'll be added in Phase 4 once there's code to test.
- `SKIP_ENV_VALIDATION=1` is needed for `tsc --noEmit` until a real `.env` is populated (all required vars are empty strings for now).

<!-- Entries go here, newest first -->
