/**
 * Customer router — profile and notification preference management.
 * Customers manage their own data via protectedProcedure.
 * Admin access to all customers via adminProcedure.
 */
import { z } from "zod";

import { connectDB } from "~/server/db/client";
import { CustomerModel } from "~/server/db/models/customer.model";
import {
  UpdateNotificationPrefsSchema,
  UpdateProfileSchema,
} from "~/lib/validators/customer.schema";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";

export const customerRouter = createTRPCRouter({
  // ── Customer self-service ─────────────────────────────────────────────────

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    await connectDB();
    const customer = await CustomerModel.findById(ctx.session.user.id, {
      name: 1,
      email: 1,
      phone: 1,
      role: 1,
      notifications: 1,
      wishlist: 1,
      createdAt: 1,
    }).lean();
    return customer;
  }),

  updateProfile: protectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      await connectDB();
      await CustomerModel.findByIdAndUpdate(ctx.session.user.id, {
        $set: input,
      });
      return { success: true };
    }),

  updateNotificationPrefs: protectedProcedure
    .input(UpdateNotificationPrefsSchema)
    .mutation(async ({ ctx, input }) => {
      await connectDB();
      const update: Record<string, unknown> = {};
      if (input.emailOptIn !== undefined)
        update["notifications.emailOptIn"] = input.emailOptIn;
      if (input.smsOptIn !== undefined)
        update["notifications.smsOptIn"] = input.smsOptIn;
      if (input.preferences) {
        for (const [key, val] of Object.entries(input.preferences)) {
          if (val !== undefined)
            update[`notifications.preferences.${key}`] = val;
        }
      }
      await CustomerModel.findByIdAndUpdate(ctx.session.user.id, {
        $set: update,
      });
      return { success: true };
    }),

  addToWishlist: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await connectDB();
      await CustomerModel.findByIdAndUpdate(ctx.session.user.id, {
        $addToSet: { wishlist: input.productId },
      });
      return { success: true };
    }),

  removeFromWishlist: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await connectDB();
      await CustomerModel.findByIdAndUpdate(ctx.session.user.id, {
        $pull: { wishlist: input.productId },
      });
      return { success: true };
    }),

  // ── Admin ────────────────────────────────────────────────────────────────

  list: adminProcedure
    .input(
      z.object({
        emailOptIn: z.boolean().optional(),
        smsOptIn: z.boolean().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      await connectDB();
      const filter: Record<string, unknown> = { role: "customer" };
      if (input.emailOptIn !== undefined)
        filter["notifications.emailOptIn"] = input.emailOptIn;
      if (input.smsOptIn !== undefined)
        filter["notifications.smsOptIn"] = input.smsOptIn;

      const skip = (input.page - 1) * input.limit;
      const [customers, total] = await Promise.all([
        CustomerModel.find(filter, {
          name: 1,
          email: 1,
          phone: 1,
          notifications: 1,
          createdAt: 1,
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(input.limit)
          .lean(),
        CustomerModel.countDocuments(filter),
      ]);
      return { customers, total };
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      await connectDB();
      return CustomerModel.findById(input.id).lean();
    }),
});
