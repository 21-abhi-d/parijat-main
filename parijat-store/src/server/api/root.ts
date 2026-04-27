import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { adminRouter } from "./routers/admin.router";
import { catalogRouter } from "./routers/catalog.router";
import { customerRouter } from "./routers/customer.router";
import { inventoryRouter } from "./routers/inventory.router";
import { notificationRouter } from "./routers/notification.router";
import { productRouter } from "./routers/product.router";
import { uploadsRouter } from "./routers/uploads.router";

export const appRouter = createTRPCRouter({
  catalog: catalogRouter,       // public: product listing + wishlist counts
  product: productRouter,       // public: getBySlug | admin: CRUD
  customer: customerRouter,     // protected: profile, notification prefs, wishlist
  inventory: inventoryRouter,   // admin: stock management + audit log
  notification: notificationRouter, // admin: send + history
  admin: adminRouter,           // admin: dashboard stats
  uploads: uploadsRouter,       // admin: presigned S3 upload URLs
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
