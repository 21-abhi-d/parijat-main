import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { connectDB } from "~/server/db/client";
import { CustomerModel } from "~/server/db/models/customer.model";
import { mongoClientPromise } from "~/server/db/mongo-client";

// ── Type augmentation ─────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "customer" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "customer" | "admin";
  }
}

// ── Auth config ───────────────────────────────────────────────────────────────

export const authConfig = {
  adapter: MongoDBAdapter(mongoClientPromise, {
    databaseName: "parijat",
  }),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Resend magic link added here once RESEND_API_KEY is configured
  ],

  // JWT strategy: sessions stored as signed cookies, not in MongoDB.
  // The adapter still creates user + account documents in MongoDB on sign-in.
  // Trade-off vs "database": sessions can't be immediately revoked, but that's
  // acceptable at boutique scale.
  session: { strategy: "jwt" },

  callbacks: {
    // On sign-in (user object present): upsert our CustomerModel and read role.
    // On subsequent requests: role is already in the token — no DB query.
    async jwt({ token, user }) {
      if (user?.email) {
        await connectDB();
        const customer = await CustomerModel.findOneAndUpdate(
          { email: user.email },
          {
            $setOnInsert: {
              email: user.email,
              name: user.name ?? "",
              role: "customer",
            },
          },
          { upsert: true, new: true },
        )
          .select("role")
          .lean();

        token.role = customer?.role ?? "customer";
      }
      return token;
    },

    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
          role: (token.role as "customer" | "admin" | undefined) ?? "customer",
        },
      };
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
