import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AiService } from './ai.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [AuthModule, ConfigModule, HttpModule],
  controllers: [AdminController],
  providers: [AdminService, AiService, PrismaService],
  exports: [AdminService, AiService],
})
export class AdminModule {}
