import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, comparePassword } from '../utils/crypto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hashPassword(dto.password);
    
    // Create user and dependencies in a transaction
    return this.prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          role: dto.role || 'STUDENT',
          targetExam: dto.targetExam || 'ACADEMIC',
          targetBand: 7.0,
          isVerified: false,
          verificationToken: crypto.randomBytes(32).toString('hex'),
        },
      });

      // Find or create a default FREE subscription plan
      let freePlan = await tx.subscriptionPlan.findUnique({
        where: { code: 'FREE' },
      });

      if (!freePlan) {
        freePlan = await tx.subscriptionPlan.create({
          data: {
            name: 'Free Starter Plan',
            code: 'FREE',
            price: 0,
            interval: 'MONTHLY',
            features: ['5 Practice Questions/day', '1 Mock Test', 'Basic Progress Tracker'],
            limitLessons: 5,
            limitDailyPractice: 5,
            limitMockTests: 1,
            hasAiWriting: false,
            hasAiSpeaking: false,
            hasTutorReview: false,
          },
        });
      }

      // Create free subscription
      await tx.subscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // Far in the future
          autoRenew: false,
        },
      });

      // Initialize progress stats
      await tx.progressStats.create({
        data: {
          userId: user.id,
          overallBandEstimate: 0.0,
          listeningHistory: [],
          readingHistory: [],
          writingHistory: [],
          speakingHistory: [],
          weakQuestionTypes: [],
        },
      });

      // Exclude passwordHash in output
      const { passwordHash: _, ...result } = user;
      return result;
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await comparePassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.role, user.email);
    
    const { passwordHash: _, ...userProfile } = user;
    return {
      user: userProfile,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return this.generateTokens(user.id, user.role, user.email);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          include: { plan: true },
        },
        progressStats: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });
    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires },
    });

    // In production we would send an email. For this implementation, we will log it.
    console.log(`[FORGOT_PASSWORD] Reset link for ${email}: http://localhost:3000/auth/reset-password?token=${resetToken}`);

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });
    if (!user) {
      throw new BadRequestExceptionOrUnauthorized('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(userId: string, role: string, email: string) {
    const payload = { sub: userId, role, email };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}

// Exception shim helper
class BadRequestExceptionOrUnauthorized extends UnauthorizedException {
  constructor(message: string) {
    super(message);
  }
}
