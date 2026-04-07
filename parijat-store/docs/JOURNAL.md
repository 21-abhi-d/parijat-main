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
