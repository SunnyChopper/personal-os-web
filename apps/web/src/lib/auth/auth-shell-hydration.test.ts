import { afterEach, describe, expect, it } from 'vitest';
import { authService } from '@/lib/auth/auth.service';

const TOKEN_KEY = 'gs_auth_tokens';
const USER_KEY = 'gs_auth_user';

function makeJwt(expSecondsFromNow: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow, sub: 'user-1' })
  );
  return `${header}.${payload}.signature`;
}

describe('authService.getShellHydrationUser', () => {
  afterEach(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  });

  it('returns stored user when token is valid', () => {
    localStorage.setItem(
      TOKEN_KEY,
      JSON.stringify({ accessToken: makeJwt(3600), expiresIn: 3600 })
    );
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        id: 'user-1',
        email: 'owner@example.com',
        role: 'owner',
      })
    );

    expect(authService.getShellHydrationUser()?.email).toBe('owner@example.com');
  });

  it('returns null when token is expired', () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken: makeJwt(-60), expiresIn: 0 }));
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        id: 'user-1',
        email: 'owner@example.com',
        role: 'owner',
      })
    );

    expect(authService.getShellHydrationUser()).toBeNull();
  });

  it('returns null when stored user email is invalid', () => {
    localStorage.setItem(
      TOKEN_KEY,
      JSON.stringify({ accessToken: makeJwt(3600), expiresIn: 3600 })
    );
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        id: 'user-1',
        email: '00000000-0000-0000-0000-000000000001',
        role: 'owner',
      })
    );

    expect(authService.getShellHydrationUser()).toBeNull();
  });
});
