import { z } from "zod";

export const NotificationPreferencesSchema = z.object({
  restocks: z.boolean(),
  festive: z.boolean(),
  sales: z.boolean(),
  events: z.boolean(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (+61400000000)")
    .optional(),
});

export const UpdateNotificationPrefsSchema = z.object({
  emailOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
  preferences: NotificationPreferencesSchema.partial().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdateNotificationPrefsInput = z.infer<
  typeof UpdateNotificationPrefsSchema
>;
