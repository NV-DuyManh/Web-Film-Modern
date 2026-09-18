import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatRequestDto } from './ai.dto';

export interface AiChatResponse {
  success: boolean;
  text: string;
  reply: string;
  provider: 'gemini' | 'groq';
  model: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  async processChat(dto: ChatRequestDto): Promise<AiChatResponse> {
    const { prompt, history = [], preferredProvider = 'groq', systemInstruction } = dto;
    const groqKeys = this.configService.get<string[]>('ai.groqKeys') || [];
    const geminiKeys = this.configService.get<string[]>('ai.geminiKeys') || [];

    const hasGroq = groqKeys.length > 0;
    const hasGemini = geminiKeys.length > 0;

    this.logger.log(
      `[AiService] AI_PROVIDER_CONFIG_PRESENT: groq=${hasGroq}, gemini=${hasGemini}`,
    );

    if (!hasGroq && !hasGemini) {
      this.logger.error(
        '[AiService] AI_PROVIDER_STATUS: NO_KEYS_CONFIGURED — No Groq or Gemini API keys configured on server.',
      );
      throw new ServiceUnavailableException(
        'No AI provider API key configured on server. ACTION REQUIRED BY OWNER: configure GROQ_API_KEYS or GEMINI_API_KEYS on Render.',
      );
    }

    const providerOrder: ('groq' | 'gemini')[] =
      preferredProvider === 'gemini'
        ? hasGemini
          ? ['gemini', 'groq']
          : ['groq']
        : hasGroq
          ? ['groq', 'gemini']
          : ['gemini'];

    let lastError: any = null;

    for (const provider of providerOrder) {
      if (provider === 'groq' && hasGroq) {
        try {
          this.logger.log('[AiService] AI_PROVIDER_REQUEST_SENT: provider=groq');
          const result = await this.callGroq(prompt, history, groqKeys, systemInstruction);
          this.logger.log('[AiService] AI_PROVIDER=groq AI_PROVIDER_STATUS=SUCCESS');
          return result;
        } catch (err: any) {
          lastError = err;
          this.logger.warn(
            `[AiService] AI_PROVIDER=groq AI_PROVIDER_STATUS=FAILED message=${err.message}`,
          );
        }
      } else if (provider === 'gemini' && hasGemini) {
        try {
          this.logger.log('[AiService] AI_PROVIDER_REQUEST_SENT: provider=gemini');
          const result = await this.callGemini(prompt, history, geminiKeys, systemInstruction);
          this.logger.log('[AiService] AI_PROVIDER=gemini AI_PROVIDER_STATUS=SUCCESS');
          return result;
        } catch (err: any) {
          lastError = err;
          this.logger.warn(
            `[AiService] AI_PROVIDER=gemini AI_PROVIDER_STATUS=FAILED message=${err.message}`,
          );
        }
      }
    }

    throw new ServiceUnavailableException(
      `AI provider execution failed: ${lastError?.message || 'All providers unavailable'}`,
    );
  }

  private async callGemini(
    prompt: string,
    history: any[],
    geminiKeys: string[],
    systemInstruction?: string,
  ): Promise<AiChatResponse> {
    const randomKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const geminiModel =
      this.configService.get<string>('ai.geminiModel') ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(randomKey);
    const model = genAI.getGenerativeModel({
      model: geminiModel,
      systemInstruction: systemInstruction || 'Bạn là trợ lý AI chuyên gia điện ảnh của hệ thống MFILM.',
    });

    const formattedHistory = history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      text,
      reply: text,
      provider: 'gemini',
      model: geminiModel,
    };
  }

  private async callGroq(
    prompt: string,
    history: any[],
    groqKeys: string[],
    systemInstruction?: string,
  ): Promise<AiChatResponse> {
    const randomKey = groqKeys[Math.floor(Math.random() * groqKeys.length)];
    const groqModel =
      this.configService.get<string>('ai.groqModel') ||
      process.env.GROQ_MODEL ||
      'openai/gpt-oss-20b';
    const messages = [
      {
        role: 'system',
        content: systemInstruction || 'Bạn là trợ lý AI chuyên gia điện ảnh của hệ thống MFILM.',
      },
      ...history.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: prompt },
    ];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${randomKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const status = res.status;
        const category =
          status === 401 || status === 403
            ? 'AUTH_ERROR'
            : status === 404
              ? 'MODEL_NOT_FOUND'
              : status === 429
                ? 'RATE_LIMIT'
                : status >= 500
                  ? 'PROVIDER_SERVER_ERROR'
                  : 'CLIENT_ERROR';
        throw new Error(
          `Groq returned HTTP ${status} (${category}): ${errBody.error?.message || 'Unknown error'}`,
        );
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể xử lý câu trả lời lúc này.';

      return {
        success: true,
        text,
        reply: text,
        provider: 'groq',
        model: groqModel,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
