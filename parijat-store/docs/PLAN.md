# Parijat — Full Technical Plan

## Context

Building a full-stack web app for a physical Indian traditional wear boutique. The site replaces social media as the primary product discovery channel and reduces friction in the customer journey. Core goals: browsable product catalog, customer profiles with notifications, Cal.com consultation booking, and an admin dashboard for one operator. Stripe payments are a future phase — design routing and layout to accommodate this without implementing it.

Key decisions made:
- Customer auth: magic link (Resend) + Google OAuth
- Catalog filtering: client-side (100–200 SKUs, in-browser)
- Images: direct upload to S3 (presigned URLs), served via CloudFront
- Booking: loose Cal.com integration — product code passed as URL param only, no DB mirroring

---

## 1. Project Structure & Folder Layout

```
src/
├── app/
│   ├── (shop)/                      # Public storefront
│   │   ├── page.tsx                 # Home/landing
│   │   ├── catalog/page.tsx         # Product catalog (most important page)
│   │   ├── products/[slug]/page.tsx # Product detail
│   │   ├── booking/page.tsx         # Cal.com embed
│   │   ├── events/page.tsx          # Showroom events & announcements
│   │   ├── account/page.tsx         # Customer profile & notification prefs
│   │   ├── cart/page.tsx            # Placeholder (future Stripe)
│   │   └── layout.tsx               # Shop layout (nav, footer)
│   ├── (admin)/                     # Admin dashboard (role-gated)
│   │   ├── admin/
│   │   │   ├── page.tsx             # Dashboard overview
│   │   │   ├── products/            # Product CRUD
│   │   │   ├── inventory/           # Stock management
│   │   │   ├── bookings/            # Cal.com booking view (read-only)
│   │   │   ├── customers/           # Customer list & notification targets
│   │   │   └── notifications/       # Compose & send notifications
│   │   └── layout.tsx               # Admin layout with sidebar
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── uploads/presign/route.ts # Presigned S3 URL generation
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── error/page.tsx
│   ├── globals.css
│   └── layout.tsx                   # Root layout (providers)
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   ├── catalog/                     # CatalogGrid, ProductCard, FilterPanel, SearchBar
│   ├── product/                     # ProductImageGallery, ProductDetail, BookingCTA
│   ├── booking/                     # CalEmbed
│   ├── admin/                       # AdminProductForm, InventoryTable, NotificationComposer
│   ├── layout/                      # Navbar, Footer, AdminSidebar
│   └── shared/                      # ImageUpload, StatusBadge, etc.
├── server/
│   ├── api/
│   │   ├── root.ts
│   │   └── routers/
│   │       ├── product.router.ts
│   │       ├── catalog.router.ts
│   │       ├── customer.router.ts
│   │       ├── inventory.router.ts
│   │       ├── notification.router.ts
│   │       ├── booking.router.ts    # Lightweight — just metadata helpers
│   │       └── admin.router.ts
│   ├── auth/
│   │   ├── config.ts
│   │   └── index.ts
│   ├── db/
│   │   ├── client.ts               # Mongoose singleton
│   │   ├── mongo-client.ts         # Raw MongoClient for NextAuth adapter
│   │   └── models/
│   │       ├── product.model.ts    # Public + internal fields
│   │       ├── customer.model.ts
│   │       ├── inventory-log.model.ts
│   │       └── notification.model.ts
│   └── services/
│       ├── inventory/
│       │   ├── inventory.interface.ts
│       │   └── mongo-inventory.service.ts
│       ├── notification/
│       │   ├── notification.interface.ts
│       │   ├── notification.service.ts  # Orchestrator
│       │   ├── email.service.ts         # Resend
│       │   └── sms.service.ts           # Twilio
│       └── storage/
│           ├── storage.interface.ts
│           └── s3-storage.service.ts
├── lib/
│   ├── validators/                  # Zod schemas (input validation + forms)
│   │   ├── product.schema.ts
│   │   ├── customer.schema.ts
│   │   ├── inventory.schema.ts
│   │   └── notification.schema.ts
│   ├── theme.ts                    # Central colour/font tokens (swappable)
│   └── utils.ts
├── trpc/
│   ├── react.tsx                   # tRPC React client (T3 scaffold location)
│   ├── server.ts                   # Server-side caller
│   └── query-client.ts
├── middleware.ts
└── env.js                          # t3-env type-safe env validation
```

---

## 2. MongoDB Schema Design

### Product (single collection, field-level separation)

The same Mongoose document holds both public and internal fields. tRPC procedures select only public fields for customer-facing queries. Internal fields are never returned by catalog/product routers.

```ts
// product.model.ts
{
  // ── Public fields (customer-facing) ──────────────────────────
  slug: String,           // URL-safe identifier (e.g. "sari-vc-001")
  code: String,           // e.g. "VC-001" (Saree Code from spreadsheet)
  name: String,
  category: String,       // "Saree" | "Suit" | "Lehenga" etc.
  type: String,           // fabric/work, e.g. "Banarasi Silk", "Georgette"
  colour: String[],       // multi-colour support
  priceAUD: Number,       // AUD sale price ONLY
  stockStatus: "in_stock" | "out_of_stock" | "backorder",
  stockQty: Number,
  images: [{ key: String, url: String, order: Number }], // S3 keys + CloudFront URLs
  description: String,
  featured: Boolean,
  active: Boolean,        // soft delete / draft

  // ── Internal fields (admin only, never exposed to customers) ─
  vendor: String,
  priceINR: Number,       // INR sale price
  costINR: Number,        // purchase cost
  audConversionRate: Number,
  costAUD: Number,        // derived: costINR * audConversionRate
  estimatedSalePrice: Number,
  sold: Boolean,

  createdAt, updatedAt    // Mongoose timestamps
}
```

### Customer

```ts
{
  email: String (unique),
  name: String,
  role: "customer" | "admin",
  phone: String,          // optional, for SMS
  notifications: {
    email: Boolean,
    sms: Boolean,
    preferences: ["restock", "events", "sales"]  // opt-in topics
  },
  createdAt, updatedAt
}
```

### InventoryLog (audit trail)

```ts
{
  productId: ObjectId (ref: Product),
  previousQty: Number,
  newQty: Number,
  previousStatus: String,
  newStatus: String,
  reason: String,         // "manual_adjustment" | "restock" | "sale"
  adminId: ObjectId,
  createdAt
}
```

### Notification (sent log)

```ts
{
  type: "restock" | "event" | "sale" | "custom",
  channel: "email" | "sms" | "both",
  subject: String,
  body: String,
  productId: ObjectId,   // optional, for restock notifs
  recipients: Number,    // count
  sentAt: Date,
  status: "sent" | "failed" | "partial",
  adminId: ObjectId
}
```

---

## 3. tRPC Router Structure

```ts
// root.ts
appRouter = {
  catalog:      catalogRouter,      // public: list products (public fields only)
  product:      productRouter,      // public: get by slug; admin: full CRUD
  customer:     customerRouter,     // protected: profile, notification prefs
  inventory:    inventoryRouter,    // admin: stock updates, log history
  notification: notificationRouter, // admin: send, preview, list sent
  admin:        adminRouter,        // admin: dashboard stats
  uploads:      uploadsRouter,      // admin: presign S3 upload URL
}
```

**Procedure types** (defined in `src/server/api/trpc.ts`):
- `publicProcedure` — no auth required
- `protectedProcedure` — any valid session
- `adminProcedure` — session with `role: "admin"` (throws FORBIDDEN otherwise)

**Key catalog procedures:**
- `catalog.list` — returns all active products with public fields only. No pagination needed at 100–200 SKUs. Client handles filtering.
- `catalog.getBySlug` — single product (public fields)

**Key product procedures:**
- `product.adminList` — all products including internal fields (adminProcedure)
- `product.create` / `product.update` / `product.delete` — adminProcedure
- `product.updateStock` — delegates to InventoryService

**Key uploads procedures:**
- `uploads.presignUrl` — generates a presigned S3 PUT URL for image upload (adminProcedure). Returns `{ uploadUrl, key, publicUrl }`.

---

## 4. NextAuth.js Setup

**Providers:**
1. **Resend** (magic link) — for customers and admin
2. **Google OAuth** — for customers

**Adapter:** `@auth/mongodb-adapter` — sessions stored in MongoDB (enables immediate session revocation).

**Session strategy:** `"database"` — one MongoDB read per request, acceptable at boutique scale.

**Admin setup:** Admin accounts are seeded with `scripts/seed-admin.ts`. Admin role is set directly on the Customer document. Google OAuth and magic link both work for admins if their email matches an admin record.

**Session augmentation** (`src/server/auth/config.ts`):
```ts
session.user.id   // from DB
session.user.role // "customer" | "admin"
```

**Route protection** (`src/middleware.ts`):
- `/admin/*` → requires `role: "admin"`
- `/account/*` → requires any valid session
- Admin layout (`src/app/(admin)/layout.tsx`) re-checks role as defence-in-depth.

---

## 5. S3 Integration for Image Uploads

**Flow:**
1. Admin selects file in `ImageUpload` component
2. Component calls `uploads.presignUrl` tRPC mutation with `{ filename, contentType }`
3. Server generates a presigned S3 PUT URL (15-min expiry) via `s3-storage.service.ts`
4. Component uploads directly from browser to S3 (no server proxying)
5. On success, component calls `product.update` with the S3 key
6. Images served via CloudFront URL (`CLOUDFRONT_URL + "/" + key`)

**Service interface** (`storage.interface.ts`):
```ts
interface StorageService {
  presignUpload(key: string, contentType: string, expiresIn?: number): Promise<string>
  deleteObject(key: string): Promise<void>
  getPublicUrl(key: string): string
}
```

**Key naming:** `products/{productId}/{uuid}.{ext}` — allows easy per-product cleanup.

Multiple images per product are supported; the `images` array on the Product model stores `{ key, url, order }`. Admin can reorder and delete images.

---

## 6. Cal.com Booking Embed

- Cal.com is embedded on `/booking` via `@calcom/embed-react`
- Product context is passed via Cal.com's `prefillValues` prop:
  ```ts
  <Cal
    calLink={process.env.NEXT_PUBLIC_CALCOM_LINK}
    config={{
      prefillValues: {
        notes: `Interested in: ${product.code} — ${product.name}`
      }
    }}
  />
  ```
- On the Product Detail page, a "Book Consultation" CTA button navigates to `/booking?product={slug}`
- The booking page reads the `product` query param, fetches the product name/code, and prefills Cal.com
- No webhook, no MongoDB booking records — Cal.com owns all booking data

---

## 7. Notification Service Design

**Interface** (`notification.interface.ts`):
```ts
interface NotificationService {
  sendRestock(productId: string): Promise<void>
  sendBroadcast(opts: { subject: string; body: string; channel: "email" | "sms" | "both"; topic?: string }): Promise<void>
}
```

**Orchestrator** (`notification.service.ts`):
1. Queries CustomerModel for opted-in recipients (filtered by channel + topic preference)
2. Dispatches to `email.service.ts` (Resend) and/or `sms.service.ts` (Twilio)
3. Logs result to Notification collection

**Email service** (Resend): sends HTML email via Resend API. Uses React Email templates.

**SMS service** (Twilio): sends SMS via Twilio Messages API. Respects opt-in preferences.

**Admin UI** (`/admin/notifications`): form to compose message, select channel (email/SMS/both), select topic, preview recipient count, send. List of previously sent notifications.

---

## 8. Inventory Service Abstraction

**Interface** (`inventory.interface.ts`):
```ts
interface InventoryService {
  getStock(productId: string): Promise<{ qty: number; status: StockStatus }>
  setStock(productId: string, qty: number, reason: string): Promise<void>
  setStatus(productId: string, status: StockStatus): Promise<void>
  getLogs(productId: string, limit?: number): Promise<InventoryLog[]>
  getBackorderSubscribers(productId: string): Promise<Customer[]>
  triggerRestockNotification(productId: string): Promise<void>
}
```

**Implementation:** `mongo-inventory.service.ts` — writes to Product model and creates InventoryLog entries atomically.

**Future integrations:** Swap or extend implementation (POS system, vendor API) without changing router or UI code.

**Stock states:**
- `in_stock` — qty > 0
- `out_of_stock` — qty = 0, not accepting interest
- `backorder` — qty = 0, customers can register interest (stored as a notification preference)

---

## 9. Admin Dashboard Scope

**`/admin`** — Overview: total products, active/out-of-stock count, recent inventory changes, quick links.

**`/admin/products`** — Table of all products (including internal fields). Create, edit, delete. Image upload. Toggle active/featured.

**`/admin/products/new` & `/admin/products/[id]`** — Full product form with all public + internal fields. ImageUpload component with multi-image support and drag-to-reorder.

**`/admin/inventory`** — Table of stock levels. Inline qty editing. Status override. Log history per product. "Notify backorder subscribers" action.

**`/admin/customers`** — List of customers, their notification preferences, opt-in counts per channel/topic.

**`/admin/notifications`** — Compose and send. View sent log (subject, channel, recipients, status, date).

**`/admin/bookings`** — Placeholder page with a Cal.com admin embed (or link to Cal.com dashboard). No custom booking data since we're not mirroring.

---

## 10. Environment Variables

All variables validated at startup via `t3-env` in `src/env.js`.

```env
# App
NEXT_PUBLIC_APP_URL=

# Auth
AUTH_SECRET=                        # openssl rand -base64 32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# MongoDB
MONGODB_URI=

# AWS S3 + CloudFront
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=                  # dev only; use IAM Role in prod
AWS_SECRET_ACCESS_KEY=              # dev only
S3_BUCKET_NAME=
CLOUDFRONT_URL=                     # https://xxxxx.cloudfront.net

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_ADDRESS=

# Twilio (SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Cal.com
NEXT_PUBLIC_CALCOM_LINK=            # e.g. "yourname/consultation"

# Analytics (no custom impl)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Future (commented out until Stripe phase)
# STRIPE_PUBLISHABLE_KEY=
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
```

**Secrets management on AWS:** Use AWS Secrets Manager or Parameter Store (SSM). ECS task role injects secrets as environment variables at runtime — no key/secret credentials on the compute resource.

---

## 11. Deployment Architecture (AWS)

```
Route 53 → CloudFront (CDN) → ALB → ECS Fargate (Next.js)
                                         ↓
                                   MongoDB Atlas (external)

S3 (images) → CloudFront (separate distribution for assets)
```

**Services:**
- **ECS Fargate** — containerised Next.js app. Auto-scaling group (min 1, max N). No EC2 to manage.
- **ECR** — Docker image registry
- **CloudFront** — CDN for Next.js app + separate distribution for S3 image assets
- **ALB** — Application Load Balancer in front of ECS
- **S3** — Product image storage (private bucket, accessed only via CloudFront OAC)
- **MongoDB Atlas** — managed MongoDB, VPC peering with AWS VPC for private connectivity
- **ACM** — SSL certificate for custom domain
- **Secrets Manager** — all env secrets, injected into ECS task definition
- **CloudWatch** — logs + basic alerting

**CI/CD:** GitHub Actions → build Docker image → push to ECR → deploy to ECS (rolling update).

---

## 12. Frontend Architecture

### Tailwind Theme & Branding

Central theme file `src/lib/theme.ts` exports colour tokens. Tailwind config extends these as CSS variables so the entire palette can be swapped by changing one file.

```ts
// src/lib/theme.ts
export const theme = {
  colors: {
    primary: "#E8621A",      // Parijat orange (placeholder — swap when brand assets arrive)
    primaryLight: "#FFF3EC",
    background: "#FFFFFF",
    text: "#1A1A1A",
    muted: "#6B6B6B",
    border: "#E5E5E5",
  },
  fonts: {
    sans: "var(--font-sans)",       // placeholder until font assets provided
    display: "var(--font-display)", // for headings/branding
  }
}
```

### Page Routing

```
/                       Home — hero, featured products, events teaser
/catalog                Product catalog (most important — client-side filter + search)
/products/[slug]        Product detail + image gallery + Book Consultation CTA
/booking                Cal.com embed (optional ?product= param)
/events                 Showroom events & announcements
/account                Customer profile, notification preferences
/cart                   Placeholder (future Stripe checkout)
/auth/signin            Sign-in page
/admin/*                Admin dashboard (role-gated)
```

### Component Organisation

**`components/catalog/`** — the most developed component group:
- `CatalogGrid` — responsive grid of ProductCards
- `ProductCard` — image-first card with name, price, stock badge
- `FilterPanel` — sidebar/drawer with category, type, colour, price range, stock filters
- `SearchBar` — debounced text search over product name/code/type/colour
- `ActiveFilters` — chip display of applied filters with clear actions

**`components/product/`**:
- `ProductImageGallery` — full-width image carousel, mobile-swipeable
- `BookingCTA` — button linking to `/booking?product={slug}`
- `StockBadge` — in stock / out of stock / backorder

**`components/layout/`**:
- `Navbar` — logo, nav links, account icon, mobile hamburger
- `Footer` — contact, social links (placeholder)
- `AdminSidebar` — navigation for admin section

### Mobile-First Approach
- Catalog: single column on mobile, 2-col on tablet, 3-col on desktop
- FilterPanel: bottom sheet drawer on mobile, sidebar on desktop
- Product images: full-width swipeable gallery on mobile
- All tap targets minimum 44px
