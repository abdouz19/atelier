import argon2 from 'argon2';
import { db } from '../../db/index';
import { auditLogs } from '../../db/schema/audit_log';
import { findUserById } from '../auth/auth.queries';
import { updatePasswordHash } from './user.queries';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = findUserById(userId);
  if (!user) throw new Error('المستخدم غير موجود');

  const isCurrentValid = await argon2.verify(user.password_hash, currentPassword);
  if (!isCurrentValid) {
    throw new Error('كلمة المرور الحالية غير صحيحة');
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    throw new Error(
      'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم',
    );
  }

  const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
  updatePasswordHash(userId, newHash);

  const now = new Date();
  db.insert(auditLogs)
    .values({
      id: crypto.randomUUID(),
      user_id: userId,
      event_type: 'password_change',
      timestamp: now,
      metadata: null,
      created_at: now,
      updated_at: now,
    })
    .run();
}
