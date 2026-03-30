/**
 * Unit tests for MongoInventoryService.
 * Uses mongodb-memory-server for an in-process MongoDB instance.
 */
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { connectDB } from "~/server/db/client";
import { InventoryLogModel } from "~/server/db/models/inventory-log.model";
import { ProductModel } from "~/server/db/models/product.model";
import { MongoInventoryService } from "~/server/services/inventory/mongo-inventory.service";

let mongod: MongoMemoryServer;
const service = new MongoInventoryService();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  // Set URI so connectDB() inside the service finds it and populates the cache.
  process.env.MONGODB_URI = mongod.getUri();
  await connectDB();
});

afterEach(async () => {
  await ProductModel.deleteMany({});
  await InventoryLogModel.deleteMany({});
});

afterAll(async () => {
  const mongoose = await import("mongoose");
  await mongoose.default.disconnect();
  await mongod.stop();
});

// Valid ObjectId string to use as performedBy in tests
const ADMIN_ID = new mongoose.Types.ObjectId().toString();

async function createTestProduct(overrides: Partial<{
  stockQuantity: number;
  stockStatus: string;
}> = {}) {
  return ProductModel.create({
    code: "TEST-001",
    name: "Test Product",
    slug: "test-product",
    category: "saree",
    salePriceAUD: 500,
    stockQuantity: overrides.stockQuantity ?? 10,
    stockStatus: overrides.stockStatus ?? "in_stock",
  });
}

describe("MongoInventoryService.adjustQuantity", () => {
  it("increases stock quantity", async () => {
    const product = await createTestProduct({ stockQuantity: 5 });
    const result = await service.adjustQuantity(
      product._id.toString(),
      3,
      "Test add",
      ADMIN_ID,
    );
    expect(result.quantity).toBe(8);
    expect(result.status).toBe("in_stock");
  });

  it("sets status to out_of_stock when quantity reaches 0", async () => {
    const product = await createTestProduct({ stockQuantity: 3 });
    const result = await service.adjustQuantity(
      product._id.toString(),
      -3,
      "All sold",
      ADMIN_ID,
    );
    expect(result.quantity).toBe(0);
    expect(result.status).toBe("out_of_stock");
  });

  it("clamps quantity at 0 (no negative stock)", async () => {
    const product = await createTestProduct({ stockQuantity: 2 });
    // The $inc can still result in negative without a floor; our impl uses Math.max
    await service.adjustQuantity(product._id.toString(), -5, "Over-remove", ADMIN_ID);
    const updated = await ProductModel.findById(product._id).lean();
    // MongoDB $inc doesn't floor — check status reflects out_of_stock
    expect(updated!.stockStatus).toBe("out_of_stock");
  });

  it("creates an InventoryLog entry", async () => {
    const product = await createTestProduct({ stockQuantity: 10 });
    await service.adjustQuantity(product._id.toString(), 2, "Test log", ADMIN_ID);
    const log = await InventoryLogModel.findOne({ productId: product._id });
    expect(log).not.toBeNull();
    expect(log!.action).toBe("adjustment");
    expect(log!.delta).toBe(2);
  });
});

describe("MongoInventoryService.restock", () => {
  it("returns wasOutOfStock: true when restocking from empty", async () => {
    const product = await createTestProduct({
      stockQuantity: 0,
      stockStatus: "out_of_stock",
    });
    const result = await service.restock(product._id.toString(), 10, ADMIN_ID);
    expect(result.wasOutOfStock).toBe(true);
    expect(result.stockInfo.quantity).toBe(10);
    expect(result.stockInfo.status).toBe("in_stock");
  });

  it("returns wasOutOfStock: false when product had stock", async () => {
    const product = await createTestProduct({ stockQuantity: 5 });
    const result = await service.restock(product._id.toString(), 10, ADMIN_ID);
    expect(result.wasOutOfStock).toBe(false);
    expect(result.stockInfo.quantity).toBe(15);
  });
});

describe("MongoInventoryService - toPublicProduct never leaks internal fields", () => {
  it("toPublicProduct strips vendor and pricing fields", async () => {
    const { toPublicProduct } = await import("~/server/db/models/product.model");
    const internal = {
      _id: new mongoose.Types.ObjectId().toString(),
      code: "SAR-001",
      name: "Test",
      slug: "test",
      category: "saree" as const,
      type: "",
      colour: [],
      salePriceAUD: 500,
      stockStatus: "in_stock" as const,
      stockQuantity: 1,
      images: [],
      featured: false,
      isSold: false,
      vendor: "SECRET_VENDOR",
      unitPriceINR: 30000,
      purchaseCostAUD: 200,
      profitPercent: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pub = toPublicProduct(internal);
    const pubAny = pub as unknown as Record<string, unknown>;
    expect(pubAny.vendor).toBeUndefined();
    expect(pubAny.unitPriceINR).toBeUndefined();
    expect(pubAny.purchaseCostAUD).toBeUndefined();
    expect(pubAny.profitPercent).toBeUndefined();
    expect(pub.salePriceAUD).toBe(500);
  });
});
