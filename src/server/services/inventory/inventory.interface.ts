/**
 * Inventory service interface.
 * Concrete implementations depend on this contract — not the other way around.
 * Swap the factory binding in index.ts to change the underlying system (MongoDB → POS).
 */
import type { StockStatus } from "~/server/db/models/product.model";

export interface StockInfo {
  productId: string;
  productCode: string;
  quantity: number;
  status: StockStatus;
  updatedAt: Date;
}

export interface RestockResult {
  stockInfo: StockInfo;
  /** True if the product was out_of_stock before this restock. */
  wasOutOfStock: boolean;
}

export interface BulkStockUpdate {
  productId: string;
  quantity: number;
  status?: StockStatus;
}

export interface BulkSyncResult {
  updated: number;
  failed: number;
  errors: { productId: string; error: string }[];
}

export interface InventoryLogEntry {
  productId: string;
  productCode: string;
  action: string;
  previousQuantity?: number;
  newQuantity?: number;
  previousStatus?: string;
  newStatus?: string;
  delta?: number;
  notes?: string;
  createdAt: Date;
}

export interface IInventoryService {
  getStock(productId: string): Promise<StockInfo>;

  /** Atomically adjusts stock quantity. Positive = add, negative = remove. */
  adjustQuantity(
    productId: string,
    delta: number,
    notes: string,
    performedBy: string,
  ): Promise<StockInfo>;

  setStatus(
    productId: string,
    status: StockStatus,
    performedBy: string,
  ): Promise<StockInfo>;

  restock(
    productId: string,
    quantity: number,
    performedBy: string,
  ): Promise<RestockResult>;

  getLogs(productId: string, limit?: number): Promise<InventoryLogEntry[]>;

  getLowStockProducts(threshold: number): Promise<StockInfo[]>;

  /** For future POS/vendor integrations — bulk sync from external system. */
  bulkSync(updates: BulkStockUpdate[]): Promise<BulkSyncResult>;
}
