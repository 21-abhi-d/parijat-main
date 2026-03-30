/**
 * Notification router — all admin-only.
 * Admin composes and triggers broadcast notifications (email/SMS).
 */
import { z } from "zod";

import { connectDB } from "~/server/db/client";
import { CustomerModel } from "~/server/db/models/customer.model";
import { NotificationModel } from "~/server/db/models/notification.model";
import {
  CreateNotificationSchema,
  SendNotificationSchema,
} from "~/lib/validators/notification.schema";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const notificationRouter = createTRPCRouter({
  /** Create a notification draft. */
  create: adminProcedure
    .input(CreateNotificationSchema)
    .mutation(async ({ input, ctx }) => {
      await connectDB();
      const notification = await NotificationModel.create({
        ...input,
        status: "draft",
        triggeredBy: ctx.session.user.id,
      });
      return { id: notification._id.toString() };
    }),

  /**
   * Trigger send for a draft notification.
   * Delegates to NotificationService which handles opt-in filtering,
   * fan-out, and status tracking.
   */
  send: adminProcedure
    .input(SendNotificationSchema)
    .mutation(async ({ input }) => {
      await connectDB();
      const { createNotificationService } = await import(
        "~/server/services/notification"
      );
      const service = createNotificationService();
      return service.sendBroadcast(input.id);
    }),

  list: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      await connectDB();
      const skip = (input.page - 1) * input.limit;
      const [notifications, total] = await Promise.all([
        NotificationModel.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(input.limit)
          .lean(),
        NotificationModel.countDocuments(),
      ]);
      return { notifications, total };
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      await connectDB();
      return NotificationModel.findById(input.id).lean();
    }),

  /** Count of customers currently opted in to email and SMS. */
  getOptInCounts: adminProcedure.query(async () => {
    await connectDB();
    const [emailCount, smsCount] = await Promise.all([
      CustomerModel.countDocuments({ "notifications.emailOptIn": true }),
      CustomerModel.countDocuments({ "notifications.smsOptIn": true }),
    ]);
    return { emailCount, smsCount };
  }),
});
