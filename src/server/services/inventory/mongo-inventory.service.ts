/**
 * MongoDB implementation of IInventoryService.
 * Uses atomic $inc operations to prevent race conditions on stock adjustments.
 */
import { connectDB } from "~/server/db/client";
import {
  InventoryLogModel,
} from "~/server/db/models/inventory-log.model";
import { ProductModel } from "~/server/db/models/product.model";
import type {
  BulkStockUpdate,
  BulkSyncResult,
  IInventoryService,
  InventoryLogEntry,
  RestockResult,
  StockInfo,
} from "./inventory.interface";
import type { StockStatus } from "~/server/db/models/product.model";

export class MongoInventoryService implements IInventoryService {
  async getStock(productId: string): Promise<StockInfo> {
    await connectDB();
    const product = await ProductModel.findById(productId, {
      code: 1,
      stockQuantity: 1,
      stockStatus: 1,
      updatedAt: 1,
    }).lean();
    if (!product) throw new Error(`Product ${productId} not found`);
    return {
      productId: product._id.toString(),
      productCode: product.code,
      quantity: product.stockQuantity,
      status: product.stockStatus as StockStatus,
      updatedAt: product.updatedAt,
    };
  }

  async adjustQuantity(
    productId: string,
    delta: number,
    notes: string,
    performedBy: string,
  ): Promise<StockInfo> {
    await connectDB();

    const before = await ProductModel.findById(productId, {
      code: 1,
      stockQuantity: 1,
      stockStatus: 1,
    }).lean();
    if (!before) throw new Error(`Product ${productId} not found`);

    const newQuantity = Math.max(0, before.stockQuantity + delta);
    const newStatus: StockStatus =
      newQuantity === 0 ? "out_of_stock" : "in_stock";

    const updated = await ProductModel.findByIdAndUpdate(
      productId,
      {
        $inc: { stockQuantity: delta },
        $set: { stockStatus: newStatus },
      },
      { new: true, select: "code stockQuantity stockStatus updatedAt" },
    ).lean();
    if (!updated) throw new Error(`Product ${productId} not found`);

    await InventoryLogModel.create({
      productId,
      productCode: before.code,
      action: "adjustment",
      previousQuantity: before.stockQuantity,
      newQuantity: updated.stockQuantity,
      previousStatus: before.stockStatus,
      newStatus: updated.stockStatus,
      delta,
      notes,
      performedBy,
    });

    return {
      productId: updated._id.toString(),
      productCode: updated.code,
      quantity: updated.stockQuantity,
      status: updated.stockStatus as StockStatus,
      updatedAt: updated.updatedAt,
    };
  }

  async setStatus(
    productId: string,
    status: StockStatus,
    performedBy: string,
  ): Promise<StockInfo> {
    await connectDB();

    const before = await ProductModel.findById(productId, {
      code: 1,
      stockStatus: 1,
      stockQuantity: 1,
    }).lean();
    if (!before) throw new Error(`Product ${productId} not found`);

    const updated = await ProductModel.findByIdAndUpdate(
      productId,
      { $set: { stockStatus: status } },
      { new: true, select: "code stockQuantity stockStatus updatedAt" },
    ).lean();
    if (!updated) throw new Error(`Product ${productId} not found`);

    await InventoryLogModel.create({
      productId,
      productCode: before.code,
      action: "status_change",
      previousStatus: before.stockStatus,
      newStatus: status,
      performedBy,
    });

    return {
      productId: updated._id.toString(),
      productCode: updated.code,
      quantity: updated.stockQuantity,
      status: updated.stockStatus as StockStatus,
      updatedAt: updated.updatedAt,
    };
  }

  async restock(
    productId: string,
    quantity: number,
    performedBy: string,
  ): Promise<RestockResult> {
    await connectDB();

    const before = await ProductModel.findById(productId, {
      code: 1,
      stockQuantity: 1,
      stockStatus: 1,
    }).lean();
    if (!before) throw new Error(`Product ${productId} not found`);

    const wasOutOfStock = before.stockStatus === "out_of_stock";
    const newQuantity = before.stockQuantity + quantity;

    const updated = await ProductModel.findByIdAndUpdate(
      productId,
      {
        $inc: { stockQuantity: quantity },
        $set: { stockStatus: "in_stock" },
      },
      { new: true, select: "code stockQuantity stockStatus updatedAt" },
    ).lean();
    if (!updated) throw new Error(`Product ${productId} not found`);

    await InventoryLogModel.create({
      productId,
      productCode: before.code,
      action: "restock",
      previousQuantity: before.stockQuantity,
      newQuantity,
      previousStatus: before.stockStatus,
      newStatus: "in_stock",
      delta: quantity,
      notes: "Restock",
      performedBy,
    });

    return {
      stockInfo: {
        productId: updated._id.toString(),
        productCode: updated.code,
        quantity: updated.stockQuantity,
        status: "in_stock",
        updatedAt: updated.updatedAt,
      },
      wasOutOfStock,
    };
  }

  async getLogs(productId: string, limit = 50): Promise<InventoryLogEntry[]> {
    await connectDB();
    const logs = await InventoryLogModel.find({ productId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return logs.map((log) => ({
      productId: log.productId.toString(),
      productCode: log.productCode,
      action: log.action,
      previousQuantity: log.previousQuantity,
      newQuantity: log.newQuantity,
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      delta: log.delta,
      notes: log.notes,
      createdAt: log.createdAt,
    }));
  }

  async getLowStockProducts(threshold: number): Promise<StockInfo[]> {
    await connectDB();
    const products = await ProductModel.find(
      { stockQuantity: { $lte: threshold }, isSold: { $ne: true } },
      { code: 1, stockQuantity: 1, stockStatus: 1, updatedAt: 1 },
    ).lean();
    return products.map((p) => ({
      productId: p._id.toString(),
      productCode: p.code,
      quantity: p.stockQuantity,
      status: p.stockStatus as StockStatus,
      updatedAt: p.updatedAt,
    }));
  }

  async bulkSync(updates: BulkStockUpdate[]): Promise<BulkSyncResult> {
    await connectDB();
    let updated = 0;
    const errors: { productId: string; error: string }[] = [];

    await Promise.allSettled(
      updates.map(async (u) => {
        try {
          const patch: Record<string, unknown> = { stockQuantity: u.quantity };
          if (u.status) patch.stockStatus = u.status;
          await ProductModel.findByIdAndUpdate(u.productId, { $set: patch });
          updated++;
        } catch (e) {
          errors.push({ productId: u.productId, error: String(e) });
        }
      }),
    );

    return { updated, failed: errors.length, errors };
  }
}
