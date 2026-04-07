import mongoose from "mongoose";

import { env } from "~/env";

const globalForMongoose = globalThis as unknown as {
  mongooseConn: typeof mongoose | undefined;
};

export async function connectDB(): Promise<typeof mongoose> {
  if (globalForMongoose.mongooseConn) {
    return globalForMongoose.mongooseConn;
  }

  const conn = await mongoose.connect(env.MONGODB_URI);
  globalForMongoose.mongooseConn = conn;
  return conn;
}
