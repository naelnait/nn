import type Database from "better-sqlite3";
import type { ContactPayload } from "../types/index.js";

export interface StoredContactMessage extends ContactPayload {
  id: number;
  createdAt: string;
}

export function insertContactMessage(db: Database.Database, payload: ContactPayload): StoredContactMessage {
  const result = db
    .prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)")
    .run(payload.name, payload.email, payload.subject, payload.message);

  const row = db
    .prepare("SELECT * FROM contact_messages WHERE id = ?")
    .get(result.lastInsertRowid) as Record<string, unknown>;

  return rowToMessage(row);
}

export function listContactMessages(db: Database.Database): StoredContactMessage[] {
  const rows = db
    .prepare("SELECT * FROM contact_messages ORDER BY id DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToMessage);
}

function rowToMessage(row: Record<string, unknown>): StoredContactMessage {
  return {
    id: row.id as number,
    name: row.name as string,
    email: row.email as string,
    subject: row.subject as string,
    message: row.message as string,
    createdAt: row.created_at as string,
  };
}
