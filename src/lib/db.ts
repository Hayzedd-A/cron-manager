// import mongoose from "mongoose";

// const MONGODB_URI = process.env.MONGODB_URI || "";

// if (!MONGODB_URI) {
//   throw new Error("Please define the MONGODB_URI environment variable");
// }

// // Extend global type to store cached connection
// declare global {
//   var mongooseConnection:
//     | {
//         conn: typeof mongoose | null;
//         promise: Promise<typeof mongoose> | null;
//       }
//     | undefined;
// }

// // Use globalThis to avoid re-connecting on every hot reload in dev
// let cached = global.mongooseConnection;

// if (!cached) {
//   cached = global.mongooseConnection = { conn: null, promise: null };
// }

// export async function connectToDatabase() {
//   if (!cached) return new Error("cached is undefined")
//   if (cached.conn) {
//     return cached.conn;
//   }

//   if (!cached.promise) {
//     cached.promise = mongoose.connect(MONGODB_URI, {
//       // Add any config options you want here
//     });
//   }

//   cached.conn = await cached.promise;
//   return cached.conn;
// }


import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Define a global cache type
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Attach cache to globalThis safely
const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseConnection?: MongooseCache;
};

// Use or initialize the global cache
let cached = globalWithMongoose.mongooseConnection;

if (!cached) {
  cached = {
    conn: null,
    promise: null,
  };
  globalWithMongoose.mongooseConnection = cached;
}

export async function connectToDatabase() {
  if (!cached) return null
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      // Optional: Add Mongoose options like useNewUrlParser, useUnifiedTopology, etc.
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
