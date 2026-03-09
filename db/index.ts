import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

import fs from "node:fs";
import path from "node:path";

const dbFilePath =
  process.env.SQLITE_PATH ?? (process.env.NODE_ENV === "production"
    ? "/data/local.db"
    : path.join(process.cwd(), "data", "local.db"));

const dbDir = path.dirname(dbFilePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbFilePath);

export const db = drizzle(sqlite);



/*import path from "path";
import * as schema from "./schema";

const dbPath =
  process.env.DATABASE_URL ?? path.join(process.cwd(), "data", "local.db");

// In development, reuse the same connection to avoid "too many open" errors with hot reload
const globalForDb = globalThis as unknown as { conn: Database.Database | undefined };

const sqlite = globalForDb.conn ?? new Database(dbPath);
if (process.env.NODE_ENV !== "production") globalForDb.conn = sqlite;

export const db = drizzle(sqlite, { schema });*/
