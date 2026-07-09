const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Called once by AuthContext; invoked when a request can't be recovered by a refresh. */
export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

async function rawRequest(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/api/auth/refresh', { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) return false;
        const body = await res.json();
        setAccessToken(body.accessToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  { skipAuthRetry = false }: { skipAuthRetry?: boolean } = {}
): Promise<T> {
  let res = await rawRequest(path, init);

  if (res.status === 401 && !skipAuthRetry) {
    const recovered = await tryRefresh();
    if (recovered) {
      res = await rawRequest(path, init);
    } else {
      onSessionExpired?.();
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiRequestError(
      res.status,
      body?.error?.code ?? 'UNKNOWN_ERROR',
      body?.error?.message ?? `Request failed with status ${res.status}`
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
