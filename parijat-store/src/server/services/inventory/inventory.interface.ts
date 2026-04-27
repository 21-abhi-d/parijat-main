import { type ICustomer } from "~/server/db/models/customer.model";
import {
  type IInventoryLog,
  type InventoryReason,
} from "~/server/db/models/inventory-log.model";
import { type StockStatus } from "~/server/db/models/product.model";

export interface IInventoryService {
  getStock(productId: string): Promise<{ qty: number; status: StockStatus }>;

  setStock(
    productId: string,
    qty: number,
    status: StockStatus,
    reason: InventoryReason,
    adminId: string,
  ): Promise<void>;

  getLogs(productId: string, limit?: number): Promise<IInventoryLog[]>;

  /** Returns customers who have wishlisted the product — used for restock notifications. */
  getWishlistSubscribers(productId: string): Promise<ICustomer[]>;
}
