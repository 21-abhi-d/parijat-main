/**
 * InventoryLog model — immutable audit trail for all stock changes.
 * Written on every inventory mutation; never updated.
 */
import mongoose, { type Document, Schema } from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InventoryAction =
  | "restock"
  | "sale"
  | "adjustment"
  | "backorder_set"
  | "status_change";

export interface IInventoryLog {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productCode: string;
  action: InventoryAction;
  previousQuantity?: number;
  newQuantity?: number;
  previousStatus?: string;
  newStatus?: string;
  delta?: number;
  notes?: string;
  performedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const InventoryLogSchema = new Schema<IInventoryLog & Document>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productCode: { type: String, required: true },
    action: {
      type: String,
      enum: [
        "restock",
        "sale",
        "adjustment",
        "backorder_set",
        "status_change",
      ] as const,
      required: true,
    },
    previousQuantity: { type: Number },
    newQuantity: { type: Number },
    previousStatus: { type: String },
    newStatus: { type: String },
    delta: { type: Number },
    notes: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

InventoryLogSchema.index({ productId: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const InventoryLogModel =
  (mongoose.models.InventoryLog as mongoose.Model<
    IInventoryLog & Document
  >) ??
  mongoose.model<IInventoryLog & Document>(
    "InventoryLog",
    InventoryLogSchema,
  );
