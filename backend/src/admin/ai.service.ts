import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { decrypt } from '../utils/crypto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '12345678901234567890123456789012';
  }

  async generateChatCompletion(
    messages: Array<{ role: string; content: string }>,
    customProvider?: string,
    customModel?: string,
    customKey?: string,
  ): Promise<{ text: string; tokensUsed: number; cost: number; timeMs: number }> {
    const start = Date.now();

    // 1. Get settings from database
    const settings = await this.prisma.appSettings.findMany();
    const getVal = (key: string) => settings.find((s) => s.key === key)?.value || '';

    const isEnabled = getVal('ai_enabled') === 'true';
    if (!isEnabled && !customProvider) {
      throw new BadRequestException('AI engine is globally disabled by administrator');
    }

    const provider = customProvider || getVal('active_ai_provider');
    
    let apiKey = '';
    let model = '';
    let baseUrl = '';

    // 2. Resolve provider credentials
    if (provider === 'openai') {
      apiKey = customKey || this.decryptKey(getVal('ai_openai_key'));
      model = customModel || getVal('ai_openai_model') || 'gpt-4o';
      baseUrl = getVal('ai_openai_url') || 'https://api.openai.com/v1';
    } else if (provider === 'gemini') {
      apiKey = customKey || this.decryptKey(getVal('ai_gemini_key'));
      model = customModel || getVal('ai_gemini_model') || 'gemini-1.5-pro';
      baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai'; // Google's OpenAI-compatible endpoint
    } else if (provider === 'groq') {
      apiKey = customKey || this.decryptKey(getVal('ai_groq_key'));
      model = customModel || getVal('ai_groq_model') || 'llama-3.3-70b-versatile';
      baseUrl = 'https://api.groq.com/openai/v1';
    } else if (provider === 'ollama') {
      model = customModel || 'llama3';
      baseUrl = 'http://localhost:11434/v1'; // Local Ollama OpenAI-compatible port
    } else {
      throw new BadRequestException(`AI Provider ${provider} is not supported or not configured`);
    }

    if (!apiKey && provider !== 'ollama') {
      throw new BadRequestException(`API Key for provider [${provider}] is missing or not configured`);
    }

    // 3. Make HTTP request (OpenAI-compatible request body format)
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${baseUrl}/chat/completions`,
          {
            model: model,
            messages: messages,
            temperature: 0.3,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            timeout: 30000, // 30s timeout
          },
        ),
      );

      const timeMs = Date.now() - start;
      const text = response.data.choices[0].message.content;
      const promptTokens = response.data.usage?.prompt_tokens || 0;
      const completionTokens = response.data.usage?.completion_tokens || 0;
      const tokensUsed = promptTokens + completionTokens;

      // 4. Calculate estimated pricing
      let cost = 0;
      if (provider === 'openai') {
        // GPT-4o: $5.00 / 1M input tokens, $15.00 / 1M output tokens
        cost = (promptTokens * 5 + completionTokens * 15) / 1000000;
      } else if (provider === 'gemini') {
        // Gemini 1.5 Pro: $1.25 / 1M input, $5.00 / 1M output
        cost = (promptTokens * 1.25 + completionTokens * 5) / 1000000;
      } else if (provider === 'groq') {
        // Groq Llama 3 70b: $0.59 / 1M input, $0.79 / 1M output
        cost = (promptTokens * 0.59 + completionTokens * 0.79) / 1000000;
      }

      return {
        text,
        tokensUsed,
        cost,
        timeMs,
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message || 'AI request failed';
      throw new BadRequestException(`AI Engine Error: ${errMsg}`);
    }
  }

  private decryptKey(val: string): string {
    if (!val) return '';
    try {
      return decrypt(val, this.encryptionKey);
    } catch {
      return '';
    }
  }
}
