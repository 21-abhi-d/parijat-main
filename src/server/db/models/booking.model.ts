/**
 * Booking model — stores consultation bookings synced from Cal.com.
 * Customers can book without being signed in; customerId is optional.
 */
import mongoose, { type Document, Schema } from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface IBooking {
  _id: mongoose.Types.ObjectId;
  calcomBookingId?: string;
  calcomBookingUid?: string;
  customerId?: mongoose.Types.ObjectId;
  customerEmail: string;
  customerName: string;
  productRef?: mongoose.Types.ObjectId;
  productCode?: string;
  scheduledAt: Date;
  status: BookingStatus;
  notes?: string;
  calcomMetadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const BookingSchema = new Schema<IBooking & Document>(
  {
    calcomBookingId: { type: String, unique: true, sparse: true },
    calcomBookingUid: { type: String },
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    customerEmail: { type: String, required: true, lowercase: true },
    customerName: { type: String, required: true },
    productRef: { type: Schema.Types.ObjectId, ref: "Product" },
    productCode: { type: String },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"] as const,
      default: "pending",
    },
    notes: { type: String },
    // Raw Cal.com payload stored for debugging/audit
    calcomMetadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

BookingSchema.index({ customerId: 1 });
BookingSchema.index({ customerEmail: 1 });
BookingSchema.index({ scheduledAt: -1 });
BookingSchema.index({ status: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const BookingModel =
  (mongoose.models.Booking as mongoose.Model<IBooking & Document>) ??
  mongoose.model<IBooking & Document>("Booking", BookingSchema);
