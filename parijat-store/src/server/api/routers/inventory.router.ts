import { z } from "zod";

import { connectDB } from "~/server/db/client";
import { ProductModel } from "~/server/db/models/product.model";
import { inventoryService } from "~/server/services/inventory/mongo-inventory.service";
import {
  setStockSchema,
  getLogsSchema,
} from "~/lib/validators/inventory.schema";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const inventoryRouter = createTRPCRouter({
  // All products with current stock levels — for the inventory dashboard table
  listStock: adminProcedure.query(async () => {
    await connectDB();
    return ProductModel.find({})
      .select("code name category stockQty stockStatus active")
      .sort({ category: 1, name: 1 })
      .lean();
  }),

  // Current stock for a single product
  getStock: adminProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input }) => {
      await connectDB();
      return inventoryService.getStock(input.productId);
    }),

  // Update stock — writes audit log and updates product in sequence
  setStock: adminProcedure
    .input(setStockSchema)
    .mutation(async ({ ctx, input }) => {
      await connectDB();
      await inventoryService.setStock(
        input.productId,
        input.stockQty,
        input.stockStatus,
        input.reason,
        ctx.session.user.id,
      );
      return { success: true };
    }),

  // Inventory log for a single product — newest first
  getLogs: adminProcedure
    .input(getLogsSchema)
    .query(async ({ input }) => {
      await connectDB();
      return inventoryService.getLogs(input.productId, input.limit);
    }),
});
