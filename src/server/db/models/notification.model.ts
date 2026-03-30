/**
 * Notification model — tracks all broadcast notification campaigns.
 * Admin creates a notification, then triggers send.
 */
import mongoose, { type Document, Schema } from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "restock"
  | "festive"
  | "sale"
  | "event"
  | "custom";

export type NotificationChannel = "email" | "sms" | "both";

export type RecipientType =
  | "all_opted_in"
  | "email_opted_in"
  | "sms_opted_in"
  | "specific";

export type NotificationStatus =
  | "draft"
  | "queued"
  | "sending"
  | "sent"
  | "failed";

export interface INotification {
  _id: mongoose.Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  recipientType: RecipientType;
  specificRecipients: mongoose.Types.ObjectId[];
  productRefs: mongoose.Types.ObjectId[];
  status: NotificationStatus;
  sentAt?: Date;
  sentCount: number;
  failedCount: number;
  triggeredBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const NotificationSchema = new Schema<INotification & Document>(
  {
    type: {
      type: String,
      enum: ["restock", "festive", "sale", "event", "custom"] as const,
      required: true,
    },
    channel: {
      type: String,
      enum: ["email", "sms", "both"] as const,
      required: true,
    },
    subject: { type: String },
    body: { type: String, required: true },
    recipientType: {
      type: String,
      enum: [
        "all_opted_in",
        "email_opted_in",
        "sms_opted_in",
        "specific",
      ] as const,
      required: true,
    },
    specificRecipients: [{ type: Schema.Types.ObjectId, ref: "User" }],
    productRefs: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    status: {
      type: String,
      enum: ["draft", "queued", "sending", "sent", "failed"] as const,
      default: "draft",
    },
    sentAt: { type: Date },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    triggeredBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({ status: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<INotification & Document>) ??
  mongoose.model<INotification & Document>(
    "Notification",
    NotificationSchema,
  );
