import { z } from "zod";

export const BookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const CreateBookingSchema = z.object({
  calcomBookingId: z.string().optional(),
  calcomBookingUid: z.string().optional(),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  productCode: z.string().optional(),
  scheduledAt: z.date(),
  notes: z.string().max(1000).optional(),
  calcomMetadata: z.record(z.unknown()).optional(),
});

export const UpdateBookingStatusSchema = z.object({
  id: z.string(),
  status: BookingStatusSchema,
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;
