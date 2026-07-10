import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);
  
  const allowedOriginsStr = configService.get<string>('ALLOWED_ORIGINS') || 'http://localhost:3000,http://localhost:3001,https://bandup-ielts-prep.vercel.app,https://bandup-ielts-admin.vercel.app,https://website-blue-omega-77.vercel.app,https://admin-brown-iota-42.vercel.app';
  const allowedOrigins = allowedOriginsStr.split(',').map(o => o.trim());
  
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Auto-seed production super-admin if missing
  try {
    const prisma = app.get(PrismaService);
    const adminEmail = 'joshuaomatsuli01@gmail.com';
    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminUser) {
      const passwordHash = await bcrypt.hash('Jos@56567', 10);
      const user = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Joshua Omatsuli',
          passwordHash,
          role: 'SUPER_ADMIN',
          targetBand: 9.0,
        },
      });
      await prisma.progressStats.create({
        data: { userId: user.id },
      });
      console.log(`[BOOTSTRAP] Auto-seeded SUPER_ADMIN user: ${adminEmail}`);
    } else {
      // Just ensure they are SUPER_ADMIN and password matches
      const passwordHash = await bcrypt.hash('Jos@56567', 10);
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'SUPER_ADMIN', passwordHash },
      });
      console.log(`[BOOTSTRAP] Verified SUPER_ADMIN credentials for: ${adminEmail}`);
    }
  } catch (err) {
    console.error('[BOOTSTRAP] Admin auto-seeding skipped or failed:', err);
  }

  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port);
  console.log(`[BOOTSTRAP] Server running on http://localhost:${port}/api`);
}
bootstrap();

