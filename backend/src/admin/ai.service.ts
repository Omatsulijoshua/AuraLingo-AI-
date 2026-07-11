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

    // 2. Resolve all available candidate providers with fallback routing
    const candidates: Array<{ providerName: string; apiKey: string; model: string; baseUrl: string; keyIndex: number }> = [];

    const addCandidate = (name: string, keyVal: string, modelVal: string, defaultModel: string, defaultUrl: string) => {
      let keysString = '';
      if (customProvider === name && customKey) {
        keysString = customKey;
      } else {
        keysString = this.decryptKey(keyVal);
      }

      if (keysString) {
        const keysList = keysString.split(',').map(k => k.trim()).filter(Boolean);
        keysList.forEach((key, index) => {
          candidates.push({
            providerName: name,
            apiKey: key,
            model: (customProvider === name && customModel) ? customModel : (modelVal || defaultModel),
            baseUrl: defaultUrl,
            keyIndex: index + 1,
          });
        });
      }
    };

    addCandidate('gemini', getVal('ai_gemini_key'), getVal('ai_gemini_model'), 'gemini-1.5-flash', 'https://generativelanguage.googleapis.com/v1beta/openai');
    addCandidate('groq', getVal('ai_groq_key'), getVal('ai_groq_model'), 'llama-3.3-70b-versatile', 'https://api.groq.com/openai/v1');
    addCandidate('nvidia', getVal('ai_nvidia_key'), getVal('ai_nvidia_model'), 'nvidia/llama-3.1-nemotron-70b-instruct', 'https://integrate.api.nvidia.com/v1');
    addCandidate('openrouter', getVal('ai_openrouter_key'), getVal('ai_openrouter_model'), 'google/gemini-2.5-flash:free', 'https://openrouter.ai/api/v1');
    addCandidate('openai', getVal('ai_openai_key'), getVal('ai_openai_model'), 'gpt-4o', 'https://api.openai.com/v1');

    if (provider === 'ollama') {
      candidates.push({
        providerName: 'ollama',
        apiKey: '',
        model: customModel || getVal('ai_ollama_model') || 'llama3',
        baseUrl: 'http://localhost:11434/v1',
        keyIndex: 1,
      });
    }

    candidates.sort((a, b) => {
      if (a.providerName === provider) return -1;
      if (b.providerName === provider) return 1;
      return 0;
    });

    if (candidates.length === 0) {
      throw new BadRequestException('No AI provider credentials or API keys are configured in the settings');
    }

    // 3. Try candidates in sequence (Fallback Router)
    let lastError: any = null;
    for (const candidate of candidates) {
      try {
        const response = await firstValueFrom(
          this.httpService.post(
            `${candidate.baseUrl}/chat/completions`,
            {
              model: candidate.model,
              messages: messages,
              temperature: 0.3,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                ...(candidate.apiKey ? { Authorization: `Bearer ${candidate.apiKey}` } : {}),
                ...(candidate.providerName === 'openrouter' ? {
                  'HTTP-Referer': 'https://bandup-ielts.com',
                  'X-Title': 'BandUp IELTS',
                } : {}),
              },
              timeout: 30000,
            },
          ),
        );

        const timeMs = Date.now() - start;
        const text = response.data.choices[0].message.content;
        const promptTokens = response.data.usage?.prompt_tokens || 0;
        const completionTokens = response.data.usage?.completion_tokens || 0;
        const tokensUsed = promptTokens + completionTokens;

        let cost = 0;
        if (candidate.providerName === 'openai') {
          cost = (promptTokens * 5 + completionTokens * 15) / 1000000;
        } else if (candidate.providerName === 'gemini') {
          cost = (promptTokens * 0.075 + completionTokens * 0.3) / 1000000;
        } else if (candidate.providerName === 'groq') {
          cost = (promptTokens * 0.59 + completionTokens * 0.79) / 1000000;
        }

        return {
          text,
          tokensUsed,
          cost,
          timeMs,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`AI Provider [${candidate.providerName}] Key #${candidate.keyIndex} failed with: ${err.message || err}. Attempting fallback...`);
      }
    }

    const errMsg = lastError?.response?.data?.error?.message || lastError?.message || lastError;
    throw new BadRequestException(`All configured AI Providers failed. Last error: ${errMsg}`);
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
