import { z } from 'zod';

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().optional(),
});
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

export const resendVerificationRequestSchema = z.object({
  email: z.string().email(),
});
export type ResendVerificationRequest = z.infer<typeof resendVerificationRequestSchema>;

export interface UserDto {
  id: number;
  email: string;
  createdAt: string;
}

/** Registration doesn't log the user in -- they still need to confirm their
 * email before their first login, so no tokens are issued yet. */
export interface RegisterResponse {
  user: UserDto;
}

export interface AuthResponse {
  user: UserDto;
  accessToken: string;
  /** Only present for native clients (web relies on the httpOnly cookie instead). */
  refreshToken?: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}
