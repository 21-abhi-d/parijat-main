import mongoose, { type Document, type Model, Schema } from "mongoose";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "admin";
export type NotificationTopic = "restock" | "events" | "sales";

export interface ICustomerNotificationPrefs {
  email: boolean;
  sms: boolean;
  topics: NotificationTopic[];
}

export interface ICustomer extends Document {
  email: string;
  name?: string;
  role: UserRole;
  phone?: string;
  notifications: ICustomerNotificationPrefs;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const notificationPrefsSchema = new Schema<ICustomerNotificationPrefs>(
  {
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    topics: {
      type: [String],
      enum: ["restock", "events", "sales"] satisfies NotificationTopic[],
      default: [],
    },
  },
  { _id: false },
);

const customerSchema = new Schema<ICustomer>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    role: {
      type: String,
      enum: ["customer", "admin"] satisfies UserRole[],
      default: "customer",
      required: true,
    },
    phone: { type: String, trim: true },
    notifications: { type: notificationPrefsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

// ── Model ─────────────────────────────────────────────────────────────────────

export const CustomerModel: Model<ICustomer> =
  mongoose.models.Customer ??
  mongoose.model<ICustomer>("Customer", customerSchema);
