/**
 * Decodes JWT payload without any external library.
 * Uses atob() to base64-decode the payload segment.
 * Matches the backend JWT claim structure exactly.
 */

export interface JwtClaims {
  UserId: string;
  TenantId: string;
  Username: string;
  sub: string;
  jti: string;
  role?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  exp: number;
  iss: string;
  aud: string;
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    if (!payload) return null;

    // Pad base64 string if needed
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = 4 - (padded.length % 4);
    const paddedStr = padLength < 4 ? padded + '='.repeat(padLength) : padded;

    const decoded = atob(paddedStr);
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return null;
  }
}

/**
 * Extracts role(s) from JWT claims as a string array.
 * The backend may send a single string or an array.
 */
export function extractRoles(claims: JwtClaims): string[] {
  // .NET may serialize ClaimTypes.Role as either 'role' or the full Microsoft URI
  const raw = claims.role ?? claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') return [raw];
  return [];
}
