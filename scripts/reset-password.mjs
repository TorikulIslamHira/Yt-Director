#!/usr/bin/env node
// Admin-only password reset — run directly on the server, no email service
// needed. Also invalidates the user's existing sessions so an old/leaked
// login can't keep working after the reset.
//
// Usage: node scripts/reset-password.mjs user@example.com newPassword123

import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import Database from "better-sqlite3";

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error("Usage: node scripts/reset-password.mjs <email> <new-password>");
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
  process.exit(1);
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

const dbPath = path.join(process.cwd(), "data", "app.db");
const sqlite = new Database(dbPath);

const user = sqlite.prepare("SELECT id, email FROM users WHERE email = ?").get(email);
if (!user) {
  console.error(`কোনো ইউজার পাওয়া যায়নি এই ইমেইল দিয়ে: ${email}`);
  process.exit(1);
}

sqlite
  .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
  .run(hashPassword(newPassword), user.id);
sqlite.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);

console.log(`পাসওয়ার্ড রিসেট হয়েছে: ${email} (আগের সব session logout করা হয়েছে)`);
