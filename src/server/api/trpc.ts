import { initTRPC, TRPCError } from "@trpc/server";
import { type Session } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/auth";

/**
 * 1. CONTEXT
 * Provides session and request headers to all tRPC procedures.
 * Called once per request in the App Router handler.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();
  return {
    session,
    headers: opts.headers,
  };
};

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

/**
 * Dev timing middleware — adds artificial latency in development to catch
 * accidental waterfalls before they reach production.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  const result = await next();
  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms`);
  return result;
});

/**
 * 3. PROCEDURE TYPES
 *
 * publicProcedure    — no auth required; may still read session if present
 * protectedProcedure — requires a valid session (any role)
 * adminProcedure     — requires role === 'admin'; hard enforcement boundary
 *                      for all internal / financial data
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: ctx.session as Session & { user: NonNullable<Session["user"]> },
      },
    });
  });

export const adminProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    const user = ctx.session?.user as (Session["user"] & { role?: string }) | undefined;
    if (!user || user.role !== "admin") {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: ctx.session as Session & { user: NonNullable<Session["user"]> & { role: "admin" } },
      },
    });
  });
