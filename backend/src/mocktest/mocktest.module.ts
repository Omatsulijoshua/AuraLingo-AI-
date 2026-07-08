import { Module } from '@nestjs/common';
import { MockTestService } from './mocktest.service';
import { MockTestController } from './mocktest.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, AdminModule, ConfigModule],
  controllers: [MockTestController],
  providers: [MockTestService, PrismaService],
  exports: [MockTestService],
})
export class MockTestModule {}
