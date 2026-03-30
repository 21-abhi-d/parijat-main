/**
 * Admin aggregation router — dashboard stats and cross-domain queries.
 */
import { connectDB } from "~/server/db/client";
import { BookingModel } from "~/server/db/models/booking.model";
import { CustomerModel } from "~/server/db/models/customer.model";
import { ProductModel } from "~/server/db/models/product.model";
import { createInventoryService } from "~/server/services/inventory";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const adminRouter = createTRPCRouter({
  /** Dashboard overview stats — single round-trip for all stat cards. */
  dashboardStats: adminProcedure.query(async () => {
    await connectDB();

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const inventoryService = createInventoryService();

    const [
      totalProducts,
      bookingsThisWeek,
      emailOptIns,
      smsOptIns,
      lowStockProducts,
    ] = await Promise.all([
      ProductModel.countDocuments({ isSold: { $ne: true } }),
      BookingModel.countDocuments({ createdAt: { $gte: weekAgo } }),
      CustomerModel.countDocuments({ "notifications.emailOptIn": true }),
      CustomerModel.countDocuments({ "notifications.smsOptIn": true }),
      inventoryService.getLowStockProducts(5),
    ]);

    return {
      totalProducts,
      bookingsThisWeek,
      emailOptIns,
      smsOptIns,
      lowStockCount: lowStockProducts.length,
    };
  }),
});
