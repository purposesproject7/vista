import dotenv from "dotenv";
import mongoose from "mongoose";
import logger, { safeMeta } from "./logger.js";
dotenv.config();

const BROADCAST_ARRAY_FIELDS = new Set([
  "targetSchools",
  "targetDepartments",
  "targetSchoolsNormalized",
  "targetDepartmentsNormalized",
]);

const dropInvalidBroadcastIndexes = async () => {
  try {
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
  const uri = process.env.MONGOOSE_CONNECTIN_STRING;
  try {
    const connection = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Success! MongoDB Connected: ${connection.connection.host}`);
    await dropInvalidBroadcastIndexes();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
}
