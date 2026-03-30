import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { compare } from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { z } from "zod";

import { connectDB } from "~/server/db/client";
import { CustomerModel } from "~/server/db/models/customer.model";
import { getMongoClientPromise } from "~/server/db/mongo-client";

// ─── Module augmentation ──────────────────────────────────────────────────────
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "customer" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role: "customer" | "admin";
  }
}

// ─── Auth config ─────────────────────────────────────────────────────────────
export const authConfig = {
  adapter: MongoDBAdapter(getMongoClientPromise()),

  providers: [
    // Magic link for customer sign-in
    Resend({
      from: process.env.RESEND_FROM_ADDRESS ?? "hello@parijat.com.au",
    }),

    // Password-based sign-in for admin only
    Credentials({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string() })
          .safeParse(credentials);

        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Only admin accounts are eligible for credentials sign-in
        await connectDB();
        const user = await CustomerModel.findOne({
          email,
          role: "admin",
        }).lean();

        if (!user) return null;

        const adminHash = process.env.ADMIN_PASSWORD_HASH ?? "";
        const valid = await compare(password, adminHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: "admin" as const,
        };
      },
    }),
  ],

  session: {
    // Database sessions enable immediate role revocation.
    // Trade-off: one MongoDB read per request — acceptable at boutique scale.
    strategy: "database",
  },

  callbacks: {
    session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role: (user as { role?: string }).role === "admin" ? "admin" : "customer",
        },
      };
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
