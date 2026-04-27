import { TRPCError } from "@trpc/server";
import mongoose from "mongoose";

import { connectDB } from "~/server/db/client";
import { CustomerModel } from "~/server/db/models/customer.model";
import { ProductModel, PUBLIC_PRODUCT_FIELDS } from "~/server/db/models/product.model";
import {
  updateProfileSchema,
  updateNotificationPrefsSchema,
  wishlistItemSchema,
} from "~/lib/validators/customer.schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const customerRouter = createTRPCRouter({
  // ── Profile ────────────────────────────────────────────────────────────────

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    await connectDB();
    const customer = await CustomerModel.findOne({
      email: ctx.session.user.email,
    })
      .select("email name phone notifications wishlist role createdAt")
      .lean();

    if (!customer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
    }

    return customer;
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      await connectDB();
      const customer = await CustomerModel.findOneAndUpdate(
        { email: ctx.session.user.email },
        { $set: input },
        { new: true, runValidators: true },
      )
        .select("email name phone")
        .lean();

      if (!customer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      }

      return customer;
    }),

  // ── Notification preferences ───────────────────────────────────────────────

  updateNotificationPrefs: protectedProcedure
    .input(updateNotificationPrefsSchema)
    .mutation(async ({ ctx, input }) => {
      await connectDB();
      const update: Record<string, unknown> = {};
      if (input.email !== undefined) update["notifications.email"] = input.email;
      if (input.topics !== undefined) update["notifications.topics"] = input.topics;

      const customer = await CustomerModel.findOneAndUpdate(
        { email: ctx.session.user.email },
        { $set: update },
        { new: true },
      )
        .select("notifications")
        .lean();

      if (!customer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      }

      return customer;
    }),

  // ── Wishlist ───────────────────────────────────────────────────────────────

  getWishlist: protectedProcedure.query(async ({ ctx }) => {
    await connectDB();
    const customer = await CustomerModel.findOne({
      email: ctx.session.user.email,
    })
      .select("wishlist")
      .lean();

    if (!customer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
    }

    if (!customer.wishlist.length) return [];

    // Fetch the actual product details for each wishlisted item
    const productIds = customer.wishlist.map((w) => w.productId);
    const products = await ProductModel.find({
      _id: { $in: productIds },
      active: true,
    })
      .select(PUBLIC_PRODUCT_FIELDS)
      .lean();

    // Attach addedAt from the wishlist entry to each product
    return products.map((product) => {
      const wishlistEntry = customer.wishlist.find(
        (w) => w.productId.toString() === product._id.toString(),
      );
      return { ...product, addedAt: wishlistEntry?.addedAt };
    });
  }),

  addToWishlist: protectedProcedure
    .input(wishlistItemSchema)
    .mutation(async ({ ctx, input }) => {
      await connectDB();

      // Verify product exists and is active
      const product = await ProductModel.findOne({
        _id: input.productId,
        active: true,
      }).lean();

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // $addToSet won't add duplicates but it compares whole objects,
      // so we check manually and use $push only if not already wishlisted.
      const existing = await CustomerModel.findOne({
        email: ctx.session.user.email,
        "wishlist.productId": new mongoose.Types.ObjectId(input.productId),
      });

      if (existing) {
        return { success: true, alreadyWishlisted: true };
      }

      await CustomerModel.findOneAndUpdate(
        { email: ctx.session.user.email },
        {
          $push: {
            wishlist: {
              productId: new mongoose.Types.ObjectId(input.productId),
              addedAt: new Date(),
            },
          },
        },
      );

      return { success: true, alreadyWishlisted: false };
    }),

  removeFromWishlist: protectedProcedure
    .input(wishlistItemSchema)
    .mutation(async ({ ctx, input }) => {
      await connectDB();

      await CustomerModel.findOneAndUpdate(
        { email: ctx.session.user.email },
        {
          $pull: {
            wishlist: {
              productId: new mongoose.Types.ObjectId(input.productId),
            },
          },
        },
      );

      return { success: true };
    }),
});
