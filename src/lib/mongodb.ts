import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string; // Your full connection string
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // Avoid polluting the global namespace in production
  var _mongoClientPromise: Promise<MongoClient>;
}

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable so it’s not re-created on every reload
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
