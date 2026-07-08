import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [ContentController],
  providers: [ContentService, PrismaService],
  exports: [ContentService],
})
export class ContentModule {}
