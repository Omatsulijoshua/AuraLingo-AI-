import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PrismaService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
