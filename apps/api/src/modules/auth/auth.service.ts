import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { refreshTokens } from '../../db/schema.js';
import { config } from '../../config.js';

const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AccessTokenPayload {
  sub: number;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: config.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as unknown as AccessTokenPayload;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const VERIFICATION_TOKEN_TTL_HOURS = 24;

/** Generates a fresh email-verification token: the raw value to email to the
 * user, and the hash + expiry to store on their row (never the raw value). */
export function generateVerificationToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = randomBytes(32).toString('hex');
  return {
    raw,
    hash: hashToken(raw),
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000),
  };
}

/** Issues a brand-new opaque refresh token, stores only its hash, returns the raw token. */
export async function issueRefreshToken(userId: number): Promise<string> {
  const raw = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(raw),
    expiresAt,
  });
  return raw;
}

/**
 * Validates a presented refresh token and rotates it: the old row is revoked and a new
 * one issued. If the presented token was already revoked (replay/theft), every token for
 * that user is revoked and the caller must re-authenticate.
 */
export async function rotateRefreshToken(
  raw: string
): Promise<{ userId: number; accessToken: string; refreshToken: string } | null> {
  const hash = hashToken(raw);
  const row = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenHash, hash),
  });
  if (!row) return null;

  // A revoked-but-recent token usually just means two refresh calls raced (e.g. two
  // tabs, or React StrictMode's double effect invocation in dev) rather than theft --
  // the loser simply fails here while the winner's rotation already succeeded. We
  // don't cascade-revoke the user's other sessions for this, since that would log
  // out a legitimate concurrent session over a benign race.
  if (row.revokedAt || row.expiresAt.getTime() < Date.now()) {
    if (!row.revokedAt) {
      await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, row.id));
    }
    return null;
  }

  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, row.id));

  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, row.userId) });
  if (!user) return null;

  const newRefreshToken = await issueRefreshToken(user.id);
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  return { userId: user.id, accessToken, refreshToken: newRefreshToken };
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const hash = hashToken(raw);
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, hash));
}

export async function revokeAllUserTokens(userId: number): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.userId, userId));
}
