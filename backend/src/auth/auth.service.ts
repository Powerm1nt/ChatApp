import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, JwtPayload, AuthResponse } from './auth.config';

@Injectable()
export class AuthService {
  private users: Map<string, User> = new Map();

  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async validateToken(token: string): Promise<Omit<User, 'password'> | null> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = this.users.get(payload.sub);
      if (user) {
        const { password: _, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async getUserFromRequest(headers: any): Promise<Omit<User, 'password'> | null> {
    try {
      const authHeader = headers.authorization;
      if (!authHeader) return null;

      const token = authHeader.replace('Bearer ', '');
      return await this.validateToken(token);
    } catch (error) {
      return null;
    }
  }

  async signUp(email: string, password: string, username?: string): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(u => u.email === email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const user: User = {
      id: userId,
      email,
      username: username || email.split('@')[0],
      password: hashedPassword,
      createdAt: new Date(),
      isAnonymous: false,
    };

    this.users.set(userId, user);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      isAnonymous: false,
    };

    const access_token = this.jwtService.sign(payload);
    const { password: _, ...userResponse } = user;

    return {
      user: userResponse,
      access_token,
    };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      isAnonymous: user.isAnonymous,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      user,
      access_token,
    };
  }

  async signInAnonymous(): Promise<AuthResponse> {
    const userId = uuidv4();
    const anonymousEmail = `anonymous_${userId}@temp.com`;

    const user: User = {
      id: userId,
      email: anonymousEmail,
      username: `Guest_${userId.substring(0, 8)}`,
      password: '', // No password for anonymous users
      createdAt: new Date(),
      isAnonymous: true,
    };

    this.users.set(userId, user);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      isAnonymous: true,
    };

    const access_token = this.jwtService.sign(payload);
    const { password: _, ...userResponse } = user;

    return {
      user: userResponse,
      access_token,
    };
  }

  async findUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = this.users.get(id);
    if (user) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  // Get all users (for debugging purposes)
  getAllUsers(): Omit<User, 'password'>[] {
    return Array.from(this.users.values()).map(user => {
      const { password: _, ...result } = user;
      return result;
    });
  }
}
