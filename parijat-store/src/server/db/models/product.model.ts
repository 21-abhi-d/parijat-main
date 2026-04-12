import mongoose, { type Document, type Model, Schema } from "mongoose";

// ── Types ─────────────────────────────────────────────────────────────────────

export type StockStatus = "in_stock" | "out_of_stock" | "backorder";

export interface IProductImage {
  key: string;   // S3 object key
  url: string;   // CloudFront URL
  order: number; // display order
}

export interface IProduct extends Document {
  // ── Public fields (customer-facing) ────────────────────────────────────────
  slug: string;
  code: string;
  name: string;
  category: string;
  type: string;
  colour: string[];
  priceAUD: number;
  stockStatus: StockStatus;
  stockQty: number;
  images: IProductImage[];
  description?: string;
  active: boolean;

  // ── Internal fields (admin only — never expose to customers) ────────────────
  vendor: string;
  priceINR?: number;
  costINR?: number;
  audConversionRate?: number;
  costAUD?: number;
  sold: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const productImageSchema = new Schema<IProductImage>(
  {
    key: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    // Public
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    colour: [{ type: String, trim: true }],
    priceAUD: { type: Number, required: true, min: 0 },
    stockStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock", "backorder"] satisfies StockStatus[],
      default: "in_stock",
      required: true,
    },
    stockQty: { type: Number, default: 0, min: 0 },
    images: [productImageSchema],
    description: { type: String, trim: true },
    active: { type: Boolean, default: true },

    // Internal
    vendor: { type: String, trim: true },
    priceINR: { type: Number, min: 0 },
    costINR: { type: Number, min: 0 },
    audConversionRate: { type: Number, min: 0 },
    costAUD: { type: Number, min: 0 },
    sold: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Indexes for catalog queries
productSchema.index({ active: 1, category: 1 });
productSchema.index({ active: 1, stockStatus: 1 });
productSchema.index({ slug: 1 });

// ── Model ─────────────────────────────────────────────────────────────────────

export const ProductModel: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", productSchema);

// ── Public field selector (use this in all customer-facing queries) ───────────

export const PUBLIC_PRODUCT_FIELDS =
  "slug code name category type colour priceAUD stockStatus stockQty images description active createdAt";
