import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_PATH: z.string().default('./data/vocab.db'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  COOKIE_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Whether the refresh cookie gets the Secure flag. This is about whether the
  // site is actually served over HTTPS right now, not about NODE_ENV -- a
  // "production" deploy that's still IP-only/HTTP (as in v1 here) must keep
  // this false, since browsers silently drop Secure cookies over plain HTTP.
  // Flip to true once a domain + TLS are added.
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  // The public URL the app is served at -- used to build the link inside the
  // verification email. Defaults to the local web dev server.
  APP_ORIGIN: z.string().default('http://localhost:5173'),
  // SMTP is optional: if unset, verification emails are logged to the server
  // console instead of sent, so local dev/tests never need real credentials.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Deutsch Lernen <no-reply@deutsch-lernen.local>'),
});

export const config = envSchema.parse(process.env);
export type Config = typeof config;
