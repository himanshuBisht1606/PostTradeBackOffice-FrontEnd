import { create } from 'zustand';
import { tokenStorage } from '@core/auth/tokenStorage';
import { decodeJwt, extractRoles } from '@core/auth/jwtDecoder';
import { hasRole as checkHasRole, hasPermission as checkHasPermission } from '@utils/permissions';
import type { PermissionKey } from '@app-types/roles.types';
import type { AuthState } from '../types/auth.types';

interface AuthStore extends AuthState {
  login: (token: string, expiresAt: string, username: string) => void;
  logout: () => void;
  hydrateFromStorage: () => boolean;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: PermissionKey) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  userId: null,
  tenantId: null,
  username: null,
  roles: [],
  expiresAt: null,
  isAuthenticated: false,

  login(token, expiresAt, username) {
    const claims = decodeJwt(token);
    const roles = claims ? extractRoles(claims) : [];
    const expiry = new Date(expiresAt);

    tokenStorage.setToken(token);
    tokenStorage.setExpiresAt(expiry);

    set({
      token,
      userId: claims?.UserId ?? null,
      tenantId: claims?.TenantId ?? null,
      username,
      roles,
      expiresAt: expiry,
      isAuthenticated: true,
    });
  },

  logout() {
    tokenStorage.clear();
    set({
      token: null,
      userId: null,
      tenantId: null,
      username: null,
      roles: [],
      expiresAt: null,
      isAuthenticated: false,
    });
  },

  hydrateFromStorage(): boolean {
    if (!tokenStorage.isTokenValid()) return false;

    const token = tokenStorage.getToken();
    const expiresAt = tokenStorage.getExpiresAt();
    if (!token || !expiresAt) return false;

    const claims = decodeJwt(token);
    if (!claims) return false;

    const roles = extractRoles(claims);
    set({
      token,
      userId: claims.UserId,
      tenantId: claims.TenantId,
      username: claims.Username,
      roles,
      expiresAt,
      isAuthenticated: true,
    });
    return true;
  },

  hasRole(role) {
    const { roles } = get();
    const required = Array.isArray(role) ? role : [role];
    return checkHasRole(roles, required);
  },

  hasPermission(permission) {
    const { roles } = get();
    return checkHasPermission(roles, permission);
  },
}));
