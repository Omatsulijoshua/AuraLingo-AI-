import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Ensure uploads directory exists
  const uploadsDir = join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });
  
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
      if (
        !origin ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
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

    // Auto-seed default AppSettings if missing
    const settingsToSeed = [
      { key: 'ai_enabled', value: 'true', description: 'Global switch to enable/disable AI evaluations' },
      { key: 'active_ai_provider', value: 'openai', description: 'Active AI API provider: openai, gemini, anthropic, ollama, openrouter' },
      { key: 'ai_openai_key', value: '', description: 'OpenAI API key (encrypted)' },
      { key: 'ai_openai_model', value: 'gpt-4o', description: 'Model identifier for OpenAI' },
      { key: 'ai_openai_url', value: 'https://api.openai.com/v1', description: 'Base URL for OpenAI API' },
      { key: 'ai_gemini_key', value: '', description: 'Google Gemini API key (encrypted)' },
      { key: 'ai_gemini_model', value: 'gemini-1.5-pro', description: 'Model identifier for Google Gemini' },
      { key: 'ai_groq_key', value: '', description: 'Groq API key (encrypted)' },
      { key: 'ai_groq_model', value: 'llama-3.3-70b-versatile', description: 'Model identifier for Groq' },
      { key: 'ai_budget_daily', value: '50.00', description: 'Daily spending limit for AI features in USD' },
      { key: 'ai_budget_monthly', value: '1500.00', description: 'Monthly spending limit for AI features in USD' },
      {
        key: 'manual_bank_payment_details',
        value: '{"accountName": "Joshua toritseju omatsuli", "bankName": "Opay", "accountNumber": "8158075936"}',
        description: 'Dynamic manual bank details for student subscription payments'
      },
      {
        key: 'referral_discount_percentage',
        value: '30',
        description: 'Automatic percentage discount applied to a referred user’s first month paid subscription'
      },
      {
        key: 'referral_reward_naira',
        value: '1000',
        description: 'Amount in Naira rewarded to the referrer upon successful registration of a referred student'
      },
      {
        key: 'referral_commission_type',
        value: 'FLAT',
        description: 'Strategy type for recurring referrer rewards on subscription checkouts. Valid values: NONE, FLAT, PERCENT.'
      },
      {
        key: 'referral_commission_value',
        value: '1000',
        description: 'The value applied to the referral recurring strategy. Flat amount (in Naira) or percentage depending on strategy.'
      }
    ];

    for (const setting of settingsToSeed) {
      const existing = await prisma.appSettings.findUnique({ where: { key: setting.key } });
      if (!existing) {
        await prisma.appSettings.create({ data: setting });
        console.log(`[BOOTSTRAP] Auto-seeded AppSetting: ${setting.key}`);
      }
    }
  } catch (err) {
    console.error('[BOOTSTRAP] Admin/Settings auto-seeding skipped or failed:', err);
  }

  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port);
  console.log(`[BOOTSTRAP] Server running on http://localhost:${port}/api`);
}
bootstrap();

