import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AuthModule, SubscriptionModule, AdminModule, ConfigModule],
  controllers: [ContentController],
  providers: [ContentService, PrismaService],
  exports: [ContentService],
})
export class ContentModule {}
