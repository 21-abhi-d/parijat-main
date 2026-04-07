import { MongoClient } from "mongodb";

import { env } from "~/env";

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient | undefined;
  mongoClientPromise: Promise<MongoClient> | undefined;
};

let mongoClientPromise: Promise<MongoClient>;

if (!globalForMongo.mongoClientPromise) {
  const client = new MongoClient(env.MONGODB_URI);
  globalForMongo.mongoClient = client;
  globalForMongo.mongoClientPromise = client.connect();
}

mongoClientPromise = globalForMongo.mongoClientPromise!;

export { mongoClientPromise };
