import mongoose, { type Document, type Model, Schema } from "mongoose";

import { type StockStatus } from "./product.model";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InventoryReason =
  | "manual_adjustment"
  | "restock"
  | "sale"
  | "status_change";

export interface IInventoryLog extends Document {
  productId: mongoose.Types.ObjectId;
  previousQty: number;
  newQty: number;
  previousStatus: StockStatus;
  newStatus: StockStatus;
  reason: InventoryReason;
  adminId: mongoose.Types.ObjectId;
  createdAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const inventoryLogSchema = new Schema<IInventoryLog>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    previousQty: { type: Number, required: true },
    newQty: { type: Number, required: true },
    previousStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock", "backorder"],
      required: true,
    },
    newStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock", "backorder"],
      required: true,
    },
    reason: {
      type: String,
      enum: ["manual_adjustment", "restock", "sale", "status_change"] satisfies InventoryReason[],
      required: true,
    },
    adminId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // logs are immutable
  },
);

inventoryLogSchema.index({ productId: 1, createdAt: -1 });

// ── Model ─────────────────────────────────────────────────────────────────────

export const InventoryLogModel: Model<IInventoryLog> =
  mongoose.models.InventoryLog ??
  mongoose.model<IInventoryLog>("InventoryLog", inventoryLogSchema);
