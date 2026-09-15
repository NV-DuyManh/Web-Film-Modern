import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatRequestDto } from './ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  async processChat(dto: ChatRequestDto) {
    const { prompt, history = [], preferredProvider = 'gemini', systemInstruction } = dto;

    if (preferredProvider === 'groq') {
      try {
        return await this.callGroq(prompt, history, systemInstruction);
      } catch (err: any) {
        this.logger.warn(`Groq provider failed: ${err.message}. Falling back to Gemini...`);
        return await this.callGemini(prompt, history, systemInstruction);
      }
    } else {
      try {
        return await this.callGemini(prompt, history, systemInstruction);
      } catch (err: any) {
        this.logger.warn(`Gemini provider failed: ${err.message}. Falling back to Groq...`);
        return await this.callGroq(prompt, history, systemInstruction);
      }
    }
  }

  private async callGemini(prompt: string, history: any[], systemInstruction?: string) {
    const geminiKeys = this.configService.get<string[]>('ai.geminiKeys') || [];
    if (geminiKeys.length === 0) {
      throw new BadRequestException('No Gemini API key configured on server. ACTION REQUIRED BY OWNER.');
    }

    const randomKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(randomKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
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
      text,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    };
  }

  private async callGroq(prompt: string, history: any[], systemInstruction?: string) {
    const groqKeys = this.configService.get<string[]>('ai.groqKeys') || [];
    if (groqKeys.length === 0) {
      throw new BadRequestException('No Groq API key configured on server. ACTION REQUIRED BY OWNER.');
    }

    const randomKey = groqKeys[Math.floor(Math.random() * groqKeys.length)];
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

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${randomKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Groq API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể xử lý câu trả lời lúc này.';

    return {
      text,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
    };
  }
}
