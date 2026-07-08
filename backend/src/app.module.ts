import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ContentModule } from './content/content.module';
import { MockTestModule } from './mocktest/mocktest.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationModule } from './notification/notification.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    AdminModule,
    SubscriptionModule,
    ContentModule,
    MockTestModule,
    AnalyticsModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
