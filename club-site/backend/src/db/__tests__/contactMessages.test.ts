import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { runMigrations } from "../migrate.js";
import { insertContactMessage, listContactMessages } from "../contactMessages.js";

describe("contact messages", () => {
  let db: Database.Database;

  before(() => {
    db = new Database(":memory:");
    runMigrations(db);
  });

  after(() => {
    db.close();
  });

  it("stores a submitted message and returns it with an id and timestamp", () => {
    const saved = insertContactMessage(db, {
      name: "Camille Test",
      email: "camille@example.com",
      subject: "Question billetterie",
      message: "Avez-vous encore des places pour le prochain match ?",
    });

    assert.equal(typeof saved.id, "number");
    assert.equal(saved.name, "Camille Test");
    assert.equal(saved.email, "camille@example.com");
    assert.match(saved.createdAt, /^\d{4}-\d{2}-\d{2}/);
  });

  it("lists messages most-recent first", () => {
    insertContactMessage(db, { name: "A", email: "a@example.com", subject: "Un", message: "Premier message envoye." });
    insertContactMessage(db, { name: "B", email: "b@example.com", subject: "Deux", message: "Deuxieme message envoye." });

    const rows = listContactMessages(db);
    assert.ok(rows.length >= 2);
    assert.ok(rows[0].id > rows[1].id);
  });
});
