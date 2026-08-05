import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoachModule } from './coach/coach.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CoachModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
