import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { users } from '../../db/schema/user';

export function updatePasswordHash(userId: string, newHash: string): void {
  db.update(users)
    .set({ password_hash: newHash, updated_at: new Date() })
    .where(eq(users.id, userId))
    .run();
}
