export interface User {
  id: string;
  email: string;
  username?: string;
  password: string;
  createdAt: Date;
  isAnonymous?: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  username?: string;
  isAnonymous?: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  access_token: string;
}

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  expiresIn: '7d',
};
