import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities';
import { JwtPayload, AuthResponse } from './auth.config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
    private em: EntityManager,
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async validateToken(token: string): Promise<Omit<User, 'password'> | null> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.userRepository.findOne({ id: payload.sub });
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
    const existingUser = await this.userRepository.findOne({ email });
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User();
    user.email = email;
    user.username = username || email.split('@')[0];
    user.password = hashedPassword;
    user.isAnonymous = false;

    await this.userRepository.persistAndFlush(user);

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
    const user = new User();
    user.email = `anonymous_${user.id}@temp.com`;
    user.username = `Guest_${user.id.substring(0, 8)}`;
    user.password = ''; // No password for anonymous users
    user.isAnonymous = true;

    await this.userRepository.persistAndFlush(user);

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
    const user = await this.userRepository.findOne({ id });
    if (user) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  // Get all users (for debugging purposes)
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => {
      const { password: _, ...result } = user;
      return result;
    });
  }
}
