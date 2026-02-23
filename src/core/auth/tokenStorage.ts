/**
 * Manages JWT token persistence in sessionStorage.
 * sessionStorage is tab-scoped and cleared on tab close — preferred over localStorage.
 */

const TOKEN_KEY = 'pt_access_token';
const EXPIRES_AT_KEY = 'pt_expires_at';

export const tokenStorage = {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  getExpiresAt(): Date | null {
    const raw = sessionStorage.getItem(EXPIRES_AT_KEY);
    if (!raw) return null;
    return new Date(raw);
  },

  setExpiresAt(date: Date): void {
    sessionStorage.setItem(EXPIRES_AT_KEY, date.toISOString());
  },

  isTokenExpired(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;
    return new Date() >= expiresAt;
  },

  isTokenValid(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  },

  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRES_AT_KEY);
  },
};
