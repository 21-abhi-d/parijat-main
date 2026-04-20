import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { mongoClientPromise } from "~/server/db/mongo-client";

// ── Session type augmentation ─────────────────────────────────────────────────

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
    // Resend magic link will be added here once RESEND_API_KEY is configured
  ],

  session: {
    // Database sessions allow immediate revocation by deleting from MongoDB
    strategy: "database",
  },

  callbacks: {
    session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role: (user.role ?? "customer") as "customer" | "admin",
        },
      };
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
