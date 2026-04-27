import { z } from "zod";

export const inventoryReasonSchema = z.enum([
  "manual_adjustment",
  "restock",
  "sale",
  "status_change",
]);

export const setStockSchema = z.object({
  productId: z.string(),
  stockQty: z.number().min(0),
  stockStatus: z.enum(["in_stock", "out_of_stock", "backorder"]),
  reason: inventoryReasonSchema,
});

export const getLogsSchema = z.object({
  productId: z.string(),
  limit: z.number().min(1).max(100).default(20),
});

export type InventoryReason = z.infer<typeof inventoryReasonSchema>;
export type SetStockInput = z.infer<typeof setStockSchema>;
export type GetLogsInput = z.infer<typeof getLogsSchema>;
