/**
 * Product model — single model for all fields.
 * Access control is enforced at the tRPC layer via PUBLIC_PRODUCT_PROJECTION.
 * Internal fields (vendor, pricing, margins) are NEVER projected in public queries.
 */
import mongoose, { type Document, Schema } from "mongoose";

// ─── Field projection ─────────────────────────────────────────────────────────

/**
 * Applied to ALL public catalog/product queries.
 * Never expose internal fields to unauthenticated callers.
 */
export const PUBLIC_PRODUCT_PROJECTION = {
  code: 1,
  name: 1,
  slug: 1,
  category: 1,
  type: 1,
  colour: 1,
  salePriceAUD: 1,
  stockStatus: 1,
  stockQuantity: 1,
  images: 1,
  description: 1,
  featured: 1,
  _id: 1,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductCategory =
  | "saree"
  | "suit"
  | "lehenga"
  | "dupatta"
  | "other";

export type StockStatus = "in_stock" | "out_of_stock" | "backorder";

export interface ProductImage {
  url: string;
  alt: string;
  order: number;
}

/** Fields safe to expose publicly. */
export interface PublicProduct {
  _id: string;
  code: string;
  name: string;
  slug: string;
  category: ProductCategory;
  type: string;
  colour: string[];
  salePriceAUD: number;
  stockStatus: StockStatus;
  stockQuantity: number;
  images: ProductImage[];
  description?: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Full internal representation — admin only. */
export interface InternalProduct extends PublicProduct {
  vendor?: string;
  unitPriceINR?: number;
  salePriceINR?: number;
  audConversionRate?: number;
  purchaseCostAUD?: number;
  estimatedSalePriceAUD?: number;
  profitAUD?: number;
  profitPercent?: number;
  internalNotes?: string;
  isSold: boolean;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ProductImageSchema = new Schema<ProductImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const ProductSchema = new Schema<InternalProduct & Document>(
  {
    // ── PUBLIC fields ──────────────────────────────────────────────────────
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: {
      type: String,
      enum: ["saree", "suit", "lehenga", "dupatta", "other"] as const,
      required: true,
    },
    type: { type: String, default: "" },
    colour: [{ type: String }],
    salePriceAUD: { type: Number, required: true, min: 0 },
    stockStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock", "backorder"] as const,
      default: "in_stock",
    },
    stockQuantity: { type: Number, default: 0, min: 0 },
    images: { type: [ProductImageSchema], default: [] },
    description: { type: String },
    featured: { type: Boolean, default: false },

    // ── INTERNAL fields (never projected in public queries) ────────────────
    vendor: { type: String },
    unitPriceINR: { type: Number },
    salePriceINR: { type: Number },
    audConversionRate: { type: Number },
    purchaseCostAUD: { type: Number },
    estimatedSalePriceAUD: { type: Number },
    profitAUD: { type: Number },
    profitPercent: { type: Number },
    internalNotes: { type: String },
    isSold: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Indexes for catalog queries
ProductSchema.index({ category: 1 });
ProductSchema.index({ stockStatus: 1 });
ProductSchema.index({ featured: -1, createdAt: -1 });
ProductSchema.index({ salePriceAUD: 1 });
ProductSchema.index(
  { name: "text", type: "text", code: "text" },
  { name: "product_text_search" },
);

// ─── Transformer ──────────────────────────────────────────────────────────────

/**
 * Strips all internal fields from a product document.
 * Call this on every public procedure output to prevent accidental leakage.
 */
export function toPublicProduct(doc: Partial<InternalProduct>): PublicProduct {
  return {
    _id: String(doc._id ?? ""),
    code: doc.code ?? "",
    name: doc.name ?? "",
    slug: doc.slug ?? "",
    category: doc.category ?? "other",
    type: doc.type ?? "",
    colour: doc.colour ?? [],
    salePriceAUD: doc.salePriceAUD ?? 0,
    stockStatus: doc.stockStatus ?? "in_stock",
    stockQuantity: doc.stockQuantity ?? 0,
    images: doc.images ?? [],
    description: doc.description,
    featured: doc.featured ?? false,
    createdAt: doc.createdAt ?? new Date(),
    updatedAt: doc.updatedAt ?? new Date(),
  };
}

// ─── Model ────────────────────────────────────────────────────────────────────

export const ProductModel =
  (mongoose.models.Product as mongoose.Model<InternalProduct & Document>) ??
  mongoose.model<InternalProduct & Document>("Product", ProductSchema);
