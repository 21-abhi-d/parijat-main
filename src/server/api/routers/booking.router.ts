/**
 * Booking router.
 * create — public (called after Cal.com confirmation or from webhook)
 * getMyBookings — protected
 * list, updateStatus — admin
 */
import { z } from "zod";

import { connectDB } from "~/server/db/client";
import { BookingModel } from "~/server/db/models/booking.model";
import { ProductModel } from "~/server/db/models/product.model";
import {
  CreateBookingSchema,
  UpdateBookingStatusSchema,
} from "~/lib/validators/booking.schema";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";

export const bookingRouter = createTRPCRouter({
  /** Create a booking record — public, no auth required. */
  create: publicProcedure
    .input(CreateBookingSchema)
    .mutation(async ({ input, ctx }) => {
      await connectDB();

      // Resolve product ref from code if provided
      let productRef: string | undefined;
      if (input.productCode) {
        const product = await ProductModel.findOne({
          code: input.productCode.toUpperCase(),
        }).lean();
        if (product) productRef = product._id.toString();
      }

      const booking = await BookingModel.create({
        ...input,
        productRef,
        customerId: ctx.session?.user?.id,
      });

      return { id: booking._id.toString() };
    }),

  /** Customer's own bookings. */
  getMyBookings: protectedProcedure.query(async ({ ctx }) => {
    await connectDB();
    return BookingModel.find(
      { customerId: ctx.session.user.id },
      { calcomMetadata: 0 },
    )
      .sort({ scheduledAt: -1 })
      .lean();
  }),

  // ── Admin ────────────────────────────────────────────────────────────────

  list: adminProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "confirmed", "cancelled", "completed"])
          .optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      await connectDB();
      const filter: Record<string, unknown> = {};
      if (input.status) filter.status = input.status;

      const skip = (input.page - 1) * input.limit;
      const [bookings, total] = await Promise.all([
        BookingModel.find(filter, { calcomMetadata: 0 })
          .sort({ scheduledAt: -1 })
          .skip(skip)
          .limit(input.limit)
          .lean(),
        BookingModel.countDocuments(filter),
      ]);
      return { bookings, total };
    }),

  updateStatus: adminProcedure
    .input(UpdateBookingStatusSchema)
    .mutation(async ({ input }) => {
      await connectDB();
      await BookingModel.findByIdAndUpdate(input.id, {
        $set: { status: input.status },
      });
      return { success: true };
    }),
});
