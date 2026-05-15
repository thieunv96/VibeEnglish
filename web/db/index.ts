import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __vibeDbPool: mysql.Pool | undefined;
}

// MariaDB stores JSON columns as LONGTEXT under the hood, so mysql2's
// auto-detection (which keys off the MySQL JSON type code) doesn't kick in.
// We parse JSON-shaped columns by name to keep schema-level json() typing intact.
const JSON_COLUMNS = new Set([
  "options",
  "tags",
  "goals",
  "industries",
  "placement_result",
  "payload",
  "ai_feedback",
  "stats",
  "criteria",
  "response",
  "request",
]);

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
    typeCast(field, next) {
      if (JSON_COLUMNS.has(field.name)) {
        const raw = field.string();
        if (raw == null) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      }
      return next();
    },
  });
}

const pool = global.__vibeDbPool ?? makePool();
if (process.env.NODE_ENV !== "production") global.__vibeDbPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
