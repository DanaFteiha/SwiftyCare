// =============================================================================
// One-time index migrations
// -----------------------------------------------------------------------------
// Mongoose does NOT drop indexes that are removed from the schema; they must
// be dropped explicitly. This module runs at startup and is idempotent — it
// checks whether each legacy index still exists before attempting to drop it.
// =============================================================================

import mongoose from "mongoose";

export async function runIndexMigrations(): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const casesCollection = db.collection("cases");

    // Migration 1: drop the old unique index on nationalId (nationalId_1).
    // We now allow a patient to have multiple cases (one per visit); blocking
    // is done at the application layer (active-case check in POST /cases).
    const indexes = await casesCollection.indexes();
    const legacyUniqueIdx = indexes.find(
      (idx) => idx.name === "nationalId_1" && idx.unique === true
    );
    if (legacyUniqueIdx) {
      await casesCollection.dropIndex("nationalId_1");
      console.log("[MIGRATE] Dropped legacy unique index 'nationalId_1' on cases collection.");
    }
  } catch (err) {
    // Non-fatal — log and continue. The server can still function; the worst
    // case is that new duplicate-visit cases fail at the MongoDB layer with a
    // duplicate-key error (which is caught in caseRoutes) rather than at the
    // application pre-check.
    console.error("[MIGRATE] Index migration error (non-fatal):", err);
  }
}
