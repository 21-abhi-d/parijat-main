/**
 * Customer model.
 * Serves double duty as the Auth.js user model (via MongoDB adapter)
 * and the application customer profile.
 */
import mongoose, { type Document, Schema } from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  restocks: boolean;
  festive: boolean;
  sales: boolean;
  events: boolean;
}

export interface CustomerNotifications {
  emailOptIn: boolean;
  smsOptIn: boolean;
  preferences: NotificationPreferences;
}

export interface ICustomer {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  emailVerified?: Date | null;
  image?: string;
  phone?: string;
  role: "customer" | "admin";
  notifications: CustomerNotifications;
  wishlist: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const CustomerSchema = new Schema<ICustomer & Document>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    emailVerified: { type: Date, default: null },
    image: { type: String },
    phone: { type: String }, // E.164 format for Twilio
    role: {
      type: String,
      enum: ["customer", "admin"] as const,
      default: "customer",
    },
    notifications: {
      emailOptIn: { type: Boolean, default: false },
      smsOptIn: { type: Boolean, default: false },
      preferences: {
        restocks: { type: Boolean, default: true },
        festive: { type: Boolean, default: true },
        sales: { type: Boolean, default: true },
        events: { type: Boolean, default: true },
      },
    },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
  },
);

CustomerSchema.index({ role: 1 });
CustomerSchema.index({ "notifications.emailOptIn": 1 });
CustomerSchema.index({ "notifications.smsOptIn": 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const CustomerModel =
  (mongoose.models.User as mongoose.Model<ICustomer & Document>) ??
  mongoose.model<ICustomer & Document>("User", CustomerSchema);

// Auth.js adapter expects the model to be named "User"
