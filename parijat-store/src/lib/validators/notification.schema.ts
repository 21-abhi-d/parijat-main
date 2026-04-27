import { z } from "zod";

export const notificationTypeSchema = z.enum(["restock", "event", "sale", "custom"]);

export const notificationTopicSchema = z.enum(["restock", "events", "sales"]);

export const getRecipientCountSchema = z.object({
  topic: notificationTopicSchema.optional(),
});

export const sendNotificationSchema = z.object({
  type: notificationTypeSchema,
  subject: z.string().min(1),
  body: z.string().min(1),
  topic: notificationTopicSchema.optional(),
  productId: z.string().optional(),
});

export const listNotificationsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationTopic = z.infer<typeof notificationTopicSchema>;
export type GetRecipientCountInput = z.infer<typeof getRecipientCountSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
