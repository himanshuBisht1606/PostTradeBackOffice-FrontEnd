export interface LoginRequest {
  username: string;
  password: string;
  tenantCode: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  username: string;
  roles: string[];
}

export interface AuthState {
  token: string | null;
  userId: string | null;
  tenantId: string | null;
  username: string | null;
  roles: string[];
  expiresAt: Date | null;
  isAuthenticated: boolean;
}
