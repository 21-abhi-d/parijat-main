import mongoose, { type Document, type Model, Schema } from "mongoose";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType = "restock" | "event" | "sale" | "custom";
export type NotificationStatus = "sent" | "failed" | "partial";

export interface INotification extends Document {
  type: NotificationType;
  subject: string;
  body: string;
  productId?: mongoose.Types.ObjectId;
  recipients: number;
  status: NotificationStatus;
  adminId: mongoose.Types.ObjectId;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ["restock", "event", "sale", "custom"] satisfies NotificationType[],
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    recipients: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["sent", "failed", "partial"] satisfies NotificationStatus[],
      required: true,
    },
    adminId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    sentAt: { type: Date, required: true },
  },
  { timestamps: true },
);

notificationSchema.index({ sentAt: -1 });

// ── Model ─────────────────────────────────────────────────────────────────────

export const NotificationModel: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", notificationSchema);
