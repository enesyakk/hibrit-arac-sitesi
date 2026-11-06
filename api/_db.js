const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://nrd_admin:azXDs1FN8nqfJOOd@cluster0.z3giqcj.mongodb.net/uninotlar?authSource=admin&retryWrites=true&w=majority";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  });

  await client.connect();
  const db = client.db('uninotlar');

  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

module.exports = { connectToDatabase, ObjectId, GridFSBucket };
