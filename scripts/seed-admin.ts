/**
 * One-time admin user seed script.
 * Creates the single admin user in MongoDB if they don't already exist.
 *
 * Usage: npx tsx scripts/seed-admin.ts
 * Requires MONGODB_URI and ADMIN_EMAIL to be set in .env.
 */
import "dotenv/config";

import mongoose from "mongoose";

import { CustomerModel } from "../src/server/db/models/customer.model";

const uri = process.env.MONGODB_URI;
const email = process.env.ADMIN_EMAIL;

if (!uri || !email) {
  console.error("MONGODB_URI and ADMIN_EMAIL must be set in .env");
  process.exit(1);
}

await mongoose.connect(uri);

const existing = await CustomerModel.findOne({ email });

if (existing) {
  if (existing.role === "admin") {
    console.log(`Admin user ${email} already exists.`);
  } else {
    existing.role = "admin";
    await existing.save();
    console.log(`Upgraded ${email} to admin role.`);
  }
} else {
  await CustomerModel.create({
    name: "Admin",
    email,
    role: "admin",
    notifications: {
      emailOptIn: false,
      smsOptIn: false,
      preferences: {
        restocks: false,
        festive: false,
        sales: false,
        events: false,
      },
    },
  });
  console.log(`Created admin user: ${email}`);
}

await mongoose.disconnect();
