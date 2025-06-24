import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { JwtPayload, jwtConfig } from './auth.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('JWT Strategy validate payload:', payload);
    const user = await this.authService.findUserById(payload.sub);
    console.log('JWT Strategy found user:', user);
    if (!user) {
      console.error('JWT Strategy: User not found for ID:', payload.sub);
      return null;
    }
    return user;
  }
}