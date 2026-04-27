import { connectDB } from "~/server/db/client";
import { CustomerModel } from "~/server/db/models/customer.model";
import { NotificationModel } from "~/server/db/models/notification.model";
import { notificationService } from "~/server/services/notification/notification.service";
import {
  getRecipientCountSchema,
  sendNotificationSchema,
  listNotificationsSchema,
} from "~/lib/validators/notification.schema";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const notificationRouter = createTRPCRouter({
  // Preview recipient count before sending
  getRecipientCount: adminProcedure
    .input(getRecipientCountSchema)
    .query(async ({ input }) => {
      await connectDB();
      const filter: Record<string, unknown> = { "notifications.email": true };
      if (input.topic) {
        filter["notifications.topics"] = input.topic;
      }
      const count = await CustomerModel.countDocuments(filter);
      return { count };
    }),

  // Send a broadcast and log the result
  send: adminProcedure
    .input(sendNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      await connectDB();

      let recipients = 0;

      if (input.type === "restock" && input.productId) {
        recipients = await notificationService.sendRestock(
          input.productId,
          input.subject,
        );
      } else {
        recipients = await notificationService.sendBroadcast({
          subject: input.subject,
          body: input.body,
          topic: input.topic,
        });
      }

      await NotificationModel.create({
        type: input.type,
        subject: input.subject,
        body: input.body,
        productId: input.productId,
        recipients,
        status: "sent",
        adminId: ctx.session.user.id,
        sentAt: new Date(),
      });

      return { success: true, recipients };
    }),

  // List sent notifications — newest first
  list: adminProcedure
    .input(listNotificationsSchema)
    .query(async ({ input }) => {
      await connectDB();
      return NotificationModel.find({})
        .sort({ sentAt: -1 })
        .limit(input.limit)
        .lean();
    }),
});
