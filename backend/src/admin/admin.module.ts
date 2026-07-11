import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AiService } from './ai.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { QuestionSchedulerService } from './scheduler.service';
import { AutoSpinService } from './autospin.service';

@Module({
  imports: [AuthModule, ConfigModule, HttpModule],
  controllers: [AdminController],
  providers: [AdminService, AiService, PrismaService, QuestionSchedulerService, AutoSpinService],
  exports: [AdminService, AiService, AutoSpinService],
})
export class AdminModule {}
