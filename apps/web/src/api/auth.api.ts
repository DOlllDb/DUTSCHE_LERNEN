import type { AuthResponse, RegisterRequest, LoginRequest } from '@deutsch-lernen/shared';
import { apiRequest } from './client.js';

export function register(body: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', {
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

export function refresh(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/refresh', { method: 'POST' }, { skipAuthRetry: true });
}

export function logout(): Promise<void> {
  return apiRequest<void>('/api/auth/logout', { method: 'POST' });
}

export function me(): Promise<{ id: number; email: string; createdAt: string }> {
  return apiRequest('/api/me');
}
