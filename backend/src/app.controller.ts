import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';
import { decrypt } from './utils/crypto';
import axios from 'axios';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug-db')
  async debugDb() {
    try {
      const [pqCount, wpCount, spCount, modules, settings] = await Promise.all([
        this.prisma.practiceQuestion.count(),
        this.prisma.writingPrompt.count(),
        this.prisma.speakingPrompt.count(),
        this.prisma.module.findMany(),
        this.prisma.appSettings.findMany({
          select: { key: true, value: true },
        }),
      ]);
      return {
        status: 'OK',
        counts: {
          practiceQuestions: pqCount,
          writingPrompts: wpCount,
          speakingPrompts: spCount,
        },
        modules,
        activeSettings: settings.map(s => ({
          key: s.key,
          hasValue: !!s.value && s.value.trim() !== '',
          valueLength: s.value ? s.value.length : 0,
        })).filter(s => s.key.startsWith('ai_') || s.key === 'active_ai_provider'),
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        message: err.message || err,
      };
    }
  }

  @Get('test-keys')
  async testKeys() {
    const settings = await this.prisma.appSettings.findMany();
    const getVal = (key: string) => settings.find((s) => s.key === key)?.value || '';

    const results: Record<string, any> = {};

    const testProvider = async (name: string, defaultModel: string, defaultUrl: string, keyVal: string, modelVal: string) => {
      const key = settings.find((s) => s.key === keyVal)?.value;
      if (!key) {
        results[name] = { status: 'SKIPPED', error: 'No key configured in settings' };
        return;
      }
      
      let decryptedKey = '';
      try {
        const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '12345678901234567890123456789012';
        decryptedKey = decrypt(key, encryptionKey);
      } catch (err: any) {
        decryptedKey = key;
      }

      if (!decryptedKey) {
        results[name] = { status: 'DECRYPTION_EMPTY', error: 'Decrypted key is empty' };
        return;
      }

      const model = modelVal || defaultModel;

      try {
        const firstKey = decryptedKey.split(',')[0].trim();

        const response = await axios.post(
          `${defaultUrl}/chat/completions`,
          {
            model: model,
            messages: [{ role: 'user', content: 'Say hello!' }],
            temperature: 0.3,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${firstKey}`,
              ...(name === 'openrouter' ? {
                'HTTP-Referer': 'https://bandup-ielts.com',
                'X-Title': 'BandUp IELTS',
              } : {}),
            },
            timeout: 10000,
          },
        );

        results[name] = {
          status: 'SUCCESS',
          model,
          response: response.data.choices?.[0]?.message?.content || 'No text content returned',
        };
      } catch (err: any) {
        const errMsg = err.response?.data?.error?.message || err.message || err;
        results[name] = {
          status: 'FAILED',
          model,
          error: errMsg,
        };
      }
    };

    await testProvider('gemini', 'gemini-1.5-flash', 'https://generativelanguage.googleapis.com/v1beta/openai', 'ai_gemini_key', getVal('ai_gemini_model'));
    await testProvider('groq', 'llama-3.3-70b-versatile', 'https://api.groq.com/openai/v1', 'ai_groq_key', getVal('ai_groq_model'));
    await testProvider('nvidia', 'nvidia/llama-3.1-nemotron-70b-instruct', 'https://integrate.api.nvidia.com/v1', 'ai_nvidia_key', getVal('ai_nvidia_model'));
    await testProvider('openrouter', 'google/gemini-2.5-flash:free', 'https://openrouter.ai/api/v1', 'ai_openrouter_key', getVal('ai_openrouter_model'));

    return results;
  }
}
