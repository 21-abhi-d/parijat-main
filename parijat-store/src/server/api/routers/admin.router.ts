import { connectDB } from "~/server/db/client";
import { CustomerModel } from "~/server/db/models/customer.model";
import { InventoryLogModel } from "~/server/db/models/inventory-log.model";
import { ProductModel } from "~/server/db/models/product.model";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const adminRouter = createTRPCRouter({
  // Dashboard overview stats
  getStats: adminProcedure.query(async () => {
    await connectDB();

    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      backorderProducts,
      totalCustomers,
      recentLogs,
    ] = await Promise.all([
      ProductModel.countDocuments({}),
      ProductModel.countDocuments({ active: true }),
      ProductModel.countDocuments({ active: true, stockStatus: "out_of_stock" }),
      ProductModel.countDocuments({ active: true, stockStatus: "backorder" }),
      CustomerModel.countDocuments({ role: "customer" }),
      InventoryLogModel.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("productId", "code name")
        .lean(),
    ]);

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
        outOfStock: outOfStockProducts,
        backorder: backorderProducts,
      },
      customers: {
        total: totalCustomers,
      },
      recentInventoryChanges: recentLogs,
    };
  }),
});
