import argon2 from 'argon2';
import { db } from '../../db/index';
import { users } from '../../db/schema/user';
import { auditLogs } from '../../db/schema/audit_log';
import {
  findUserByUsername,
  findUserById,
  createSession,
  findSessionByToken,
  deleteSessionByToken,
} from './auth.queries';
import type { User } from '../../db/schema/user';

async function writeAuditLog(
  eventType: 'login_success' | 'login_failure' | 'logout' | 'password_change',
  userId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const now = new Date();
  db.insert(auditLogs)
    .values({
      id: crypto.randomUUID(),
      user_id: userId ?? null,
      event_type: eventType,
      timestamp: now,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: now,
      updated_at: now,
    })
    .run();
}

export async function seedAdminIfEmpty(): Promise<void> {
  const existing = db.select().from(users).get();
  if (existing) return;

  const passwordHash = await argon2.hash('Admin123!', { type: argon2.argon2id });
  const now = new Date();
  db.insert(users)
    .values({
      id: crypto.randomUUID(),
      username: 'admin',
      password_hash: passwordHash,
      full_name: 'المدير',
      role: 'admin',
      created_at: now,
      updated_at: now,
    })
    .run();
}

export async function login(
  username: string,
  password: string,
): Promise<{ user: User; sessionToken: string }> {
  const user = findUserByUsername(username);

  if (!user) {
    await writeAuditLog('login_failure', undefined, { username });
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  const isValid = await argon2.verify(user.password_hash, password);
  if (!isValid) {
    await writeAuditLog('login_failure', user.id, { username });
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  const sessionToken = crypto.randomUUID();
  createSession(user.id, sessionToken);
  await writeAuditLog('login_success', user.id);

  return { user, sessionToken };
}

export function checkSession(token: string): { user: User } | null {
  const session = findSessionByToken(token);
  if (!session) return null;

  const user = findUserById(session.user_id);
  if (!user) return null;

  return { user };
}

export async function logout(token: string): Promise<void> {
  const session = findSessionByToken(token);
  if (session) {
    await writeAuditLog('logout', session.user_id);
    deleteSessionByToken(token);
  }
}
