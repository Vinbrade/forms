import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { DatabaseError, toDatabaseError } from "./errors/handler";

const dataDir = path.join(__dirname, "..", "..", "data");
const dbFile = path.join(dataDir, "forms.db");
const schemaFile = path.join(__dirname, "schema.sql");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbFile);

db.pragma("journal_mode = WAL");

export function initDb(): void {
  try {
    // Apply schema from SQL file (idempotent: uses IF NOT EXISTS)
    if (fs.existsSync(schemaFile)) {
      const sql = fs.readFileSync(schemaFile, "utf8");
      db.exec(sql);
    }
  } catch (error) {
    throw toDatabaseError("initialisation", error);
  }
}

// Promise-based helpers for common query patterns
export async function dbGet<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T | undefined> {
  try {
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return row as T | undefined;
  } catch (error) {
    throw toDatabaseError("get", error);
  }
}

export async function dbAll<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return rows as T[];
  } catch (error) {
    throw toDatabaseError("all", error);
  }
}

export interface DbRunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export async function dbRun(
  sql: string,
  params: unknown[] = []
): Promise<DbRunResult> {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid,
    };
  } catch (error) {
    throw toDatabaseError("run", error);
  }
}

