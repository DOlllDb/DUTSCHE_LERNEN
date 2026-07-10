import type { AuthResponse, RegisterRequest, RegisterResponse, LoginRequest } from '@deutsch-lernen/shared';
import { apiRequest } from './client.js';

export function register(body: RegisterRequest): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function verifyEmail(token: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email: string): Promise<void> {
  return apiRequest<void>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function refresh(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/refresh', { method: 'POST' }, { skipAuthRetry: true });
}

export function logout(): Promise<void> {
  return apiRequest<void>('/api/auth/logout', { method: 'POST' });
}

export function me(): Promise<{ id: number; email: string; createdAt: string }> {
  return apiRequest('/api/me');
}
