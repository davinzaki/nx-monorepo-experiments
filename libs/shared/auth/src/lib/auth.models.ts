export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}
