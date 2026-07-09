import { eq } from 'drizzle-orm';
import { emptyProgress, type Progress } from '@deutsch-lernen/shared';
import { db } from '../../db/client.js';
import { progress } from '../../db/schema.js';

export async function getProgress(userId: number): Promise<Progress> {
  const row = await db.query.progress.findFirst({ where: eq(progress.userId, userId) });
  return row ? (row.data as Progress) : emptyProgress();
}

export async function saveProgress(userId: number, data: Progress): Promise<Progress> {
  await db
    .insert(progress)
    .values({ userId, data, updatedAt: new Date() })
    .onConflictDoUpdate({ target: progress.userId, set: { data, updatedAt: new Date() } });
  return data;
}

export async function recordQuizResult(
  userId: number,
  testDay: number,
  score: number,
  total: number
): Promise<Progress> {
  const current = await getProgress(userId);
  current.testScores[testDay] = { score, total };
  current.doneDays[testDay] = true;
  return saveProgress(userId, current);
}
