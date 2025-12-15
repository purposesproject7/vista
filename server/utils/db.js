import dotenv from "dotenv";
import mongoose from "mongoose";
import { logger, safeMeta } from "./logger.js";

dotenv.config();

const BROADCAST_ARRAY_FIELDS = new Set([
  "targetSchools",
  "targetDepartments",
  "targetSchoolsNormalized",
  "targetDepartmentsNormalized",
]);

const dropInvalidBroadcastIndexes = async () => {
  try {
    const BroadcastMessage = mongoose.model("BroadcastMessage");
    const indexes = await BroadcastMessage.collection.indexes();
    const invalidIndexes = indexes.filter((index) => {
      if (!index?.key) {
        return false;
      }
      const keys = Object.keys(index.key);
      const arrayKeys = keys.filter((key) => BROADCAST_ARRAY_FIELDS.has(key));
      return arrayKeys.length > 1;
    });

    for (const index of invalidIndexes) {
      try {
        await BroadcastMessage.collection.dropIndex(index.name);
        logger.warn(
          "broadcast_invalid_index_dropped",
          safeMeta({ indexName: index.name, keys: index.key }),
        );
      } catch (dropError) {
        if (dropError?.codeName !== "IndexNotFound") {
          logger.error(
            "broadcast_invalid_index_drop_failed",
            safeMeta({ indexName: index.name, error: dropError?.message }),
          );
        }
      }
    }
  } catch (error) {
    if (error?.codeName === "NamespaceNotFound") {
      return;
    }
    logger.error(
      "broadcast_index_scan_failed",
      safeMeta({ error: error?.message }),
    );
  }
};

export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is not defined in .env file");
    logger.error("mongo_uri_missing", {
      message: "MONGO_URI environment variable is required",
    });
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(uri);

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
    logger.info("database_connected", {
      host: connection.connection.host,
      database: connection.connection.name,
    });

    // Drop invalid broadcast indexes after connection
    await dropInvalidBroadcastIndexes();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    logger.error("database_connection_failed", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }

  // Handle connection events
  mongoose.connection.on("error", (err) => {
    logger.error("mongodb_runtime_error", {
      error: err.message,
    });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("mongodb_disconnected", {
      message: "MongoDB connection lost",
    });
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("mongodb_reconnected", {
      message: "MongoDB reconnected",
    });
  });
}
