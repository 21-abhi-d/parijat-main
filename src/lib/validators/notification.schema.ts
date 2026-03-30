import { z } from "zod";

export const NotificationTypeSchema = z.enum([
  "restock",
  "festive",
  "sale",
  "event",
  "custom",
]);

export const NotificationChannelSchema = z.enum(["email", "sms", "both"]);

export const RecipientTypeSchema = z.enum([
  "all_opted_in",
  "email_opted_in",
  "sms_opted_in",
  "specific",
]);

export const CreateNotificationSchema = z.object({
  type: NotificationTypeSchema,
  channel: NotificationChannelSchema,
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(5000),
  recipientType: RecipientTypeSchema,
  specificRecipients: z.array(z.string()).default([]),
  productRefs: z.array(z.string()).default([]),
});

export const SendNotificationSchema = z.object({
  id: z.string(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
