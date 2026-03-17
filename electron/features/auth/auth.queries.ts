import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, type User } from '../../db/schema/user';
import { sessions, type Session } from '../../db/schema/session';

export function findUserByUsername(username: string): User | undefined {
  return db.select().from(users).where(eq(users.username, username)).get();
}

export function findUserById(id: string): User | undefined {
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function createSession(userId: string, token: string): Session {
  const now = new Date();
  const id = crypto.randomUUID();
  db.insert(sessions)
    .values({
      id,
      user_id: userId,
      token,
      last_accessed: now,
      created_at: now,
      updated_at: now,
    })
    .run();
  return db.select().from(sessions).where(eq(sessions.id, id)).get()!;
}

export function findSessionByToken(token: string): Session | undefined {
  return db.select().from(sessions).where(eq(sessions.token, token)).get();
}

export function deleteSessionByToken(token: string): void {
  db.delete(sessions).where(eq(sessions.token, token)).run();
}

export function deleteAllUserSessions(userId: string): void {
  db.delete(sessions).where(eq(sessions.user_id, userId)).run();
}

export function updateUserPassword(userId: string, newHash: string): void {
  db.update(users)
    .set({ password_hash: newHash, updated_at: new Date() })
    .where(eq(users.id, userId))
    .run();
}
