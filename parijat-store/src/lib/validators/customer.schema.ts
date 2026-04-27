import { z } from "zod";

export const notificationTopicSchema = z.enum(["restock", "events", "sales"]);

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export const updateNotificationPrefsSchema = z.object({
  email: z.boolean().optional(),
  topics: z.array(notificationTopicSchema).optional(),
});

export const wishlistItemSchema = z.object({
  productId: z.string(),
});

export type NotificationTopic = z.infer<typeof notificationTopicSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateNotificationPrefsInput = z.infer<typeof updateNotificationPrefsSchema>;
export type WishlistItemInput = z.infer<typeof wishlistItemSchema>;
