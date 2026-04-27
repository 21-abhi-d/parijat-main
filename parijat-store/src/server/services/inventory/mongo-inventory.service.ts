import { TRPCError } from "@trpc/server";

import { CustomerModel } from "~/server/db/models/customer.model";
import {
  InventoryLogModel,
  type InventoryReason,
} from "~/server/db/models/inventory-log.model";
import { type StockStatus } from "~/server/db/models/product.model";
import { ProductModel } from "~/server/db/models/product.model";
import { type IInventoryService } from "./inventory.interface";

class MongoInventoryService implements IInventoryService {
  async getStock(productId: string) {
    const product = await ProductModel.findById(productId)
      .select("stockQty stockStatus")
      .lean();

    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    }

    return { qty: product.stockQty, status: product.stockStatus };
  }

  async setStock(
    productId: string,
    qty: number,
    status: StockStatus,
    reason: InventoryReason,
    adminId: string,
  ) {
    const product = await ProductModel.findById(productId)
      .select("stockQty stockStatus")
      .lean();

    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    }

    // Write audit log then update product atomically in sequence
    await InventoryLogModel.create({
      productId,
      previousQty: product.stockQty,
      newQty: qty,
      previousStatus: product.stockStatus,
      newStatus: status,
      reason,
      adminId,
    });

    await ProductModel.findByIdAndUpdate(productId, {
      stockQty: qty,
      stockStatus: status,
    });
  }

  async getLogs(productId: string, limit = 20) {
    return InventoryLogModel.find({ productId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getWishlistSubscribers(productId: string) {
    return CustomerModel.find({
      "wishlist.productId": productId,
      "notifications.email": true,
    })
      .select("email name phone notifications")
      .lean();
  }
}

export const inventoryService = new MongoInventoryService();
