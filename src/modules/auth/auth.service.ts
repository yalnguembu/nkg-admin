import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminUsersService } from '../admin/admin-users.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private adminUsersService: AdminUsersService,
    private jwtService: JwtService,
  ) { }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.adminUsersService.findByEmail(email);
    if (user && user.password === this.hashPassword(pass)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
