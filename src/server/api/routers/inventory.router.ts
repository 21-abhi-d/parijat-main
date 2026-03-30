/**
 * Inventory router — all admin-only.
 * Delegates to IInventoryService to keep the router decoupled from the
 * MongoDB implementation (enables future POS integration).
 */
import { z } from "zod";

import { createInventoryService } from "~/server/services/inventory";
import { adminProcedure, createTRPCRouter } from "../trpc";

const inventoryService = createInventoryService();

export const inventoryRouter = createTRPCRouter({
  /** Adjust stock quantity by a delta (positive = add, negative = remove). */
  adjust: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        delta: z.number().int(),
        notes: z.string().max(500).optional().default("Manual adjustment"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return inventoryService.adjustQuantity(
        input.productId,
        input.delta,
        input.notes,
        ctx.session.user.id,
      );
    }),

  /** Explicitly set stock status (in_stock / out_of_stock / backorder). */
  setStatus: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        status: z.enum(["in_stock", "out_of_stock", "backorder"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return inventoryService.setStatus(
        input.productId,
        input.status,
        ctx.session.user.id,
      );
    }),

  /**
   * Restock: increase stock quantity.
   * Returns wasOutOfStock so the caller can trigger a restock notification.
   */
  restock: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        notes: z.string().max(500).optional().default("Restock"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return inventoryService.restock(
        input.productId,
        input.quantity,
        ctx.session.user.id,
      );
    }),

  /** Audit log for a product's inventory history. */
  getLogs: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        limit: z.number().int().min(1).max(200).default(50),
      }),
    )
    .query(async ({ input }) => {
      return inventoryService.getLogs(input.productId, input.limit);
    }),

  /** Products with stock quantity at or below the given threshold. */
  getLowStock: adminProcedure
    .input(z.object({ threshold: z.number().int().min(0).default(5) }))
    .query(async ({ input }) => {
      return inventoryService.getLowStockProducts(input.threshold);
    }),
});
