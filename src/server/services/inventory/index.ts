/**
 * Inventory service factory.
 *
 * To swap to a POS integration:
 * 1. Implement SquarePOSInventoryService (or similar) implementing IInventoryService
 * 2. Change the return value below — no other files need to change
 *
 * For a gradual migration: implement a CompositeInventoryService that writes
 * to both MongoDB and the POS simultaneously, reading from the POS as source of truth.
 */
import type { IInventoryService } from "./inventory.interface";
import { MongoInventoryService } from "./mongo-inventory.service";

export function createInventoryService(): IInventoryService {
  return new MongoInventoryService();
  // Future: return new SquarePOSInventoryService();
}

export type { IInventoryService, StockInfo, RestockResult } from "./inventory.interface";
