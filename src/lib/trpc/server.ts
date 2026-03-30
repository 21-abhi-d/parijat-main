/**
 * Server-side tRPC caller for use in Server Components and Route Handlers.
 * Bypasses HTTP — calls procedures directly in-process.
 *
 * Usage:
 *   import { api } from "~/lib/trpc/server";
 *   const products = await api.catalog.list({ ... });
 */
import { headers } from "next/headers";
import { cache } from "react";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

export const api = createCaller(createContext);
