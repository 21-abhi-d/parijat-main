import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { adminRouter } from "./routers/admin.router";
import { bookingRouter } from "./routers/booking.router";
import { catalogRouter } from "./routers/catalog.router";
import { customerRouter } from "./routers/customer.router";
import { inventoryRouter } from "./routers/inventory.router";
import { notificationRouter } from "./routers/notification.router";
import { productRouter } from "./routers/product.router";

export const appRouter = createTRPCRouter({
  catalog: catalogRouter,
  product: productRouter,
  customer: customerRouter,
  booking: bookingRouter,
  inventory: inventoryRouter,
  notification: notificationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
