import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

describe('AiService', () => {
  let service: AiService;
  let controller: AiController;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'ai.groqKeys') return ['mock-groq-key-123'];
        if (key === 'ai.geminiKeys') return ['mock-gemini-key-456'];
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    controller = module.get<AiController>(AiController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Provider Configuration', () => {
    it('should throw ServiceUnavailableException when neither Groq nor Gemini keys are configured', async () => {
      (mockConfigService.get as jest.Mock).mockImplementation(() => []);

      await expect(
        service.processChat({ prompt: 'Gợi ý phim hành động' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should report clear action required message when keys are unconfigured', async () => {
      (mockConfigService.get as jest.Mock).mockImplementation(() => []);

      try {
        await service.processChat({ prompt: 'Gợi ý phim hành động' });
        fail('Should have thrown ServiceUnavailableException');
      } catch (err: any) {
        expect(err.message).toContain('ACTION REQUIRED BY OWNER');
      }
    });
  });

  describe('Happy Path Execution', () => {
    it('should return valid reply from Groq provider', async () => {
      const mockReply = 'Tôi gợi ý cho bạn phim Inception rất hay!';
      jest.spyOn(service as any, 'callGroq').mockResolvedValueOnce({
        success: true,
        text: mockReply,
        reply: mockReply,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const response = await service.processChat({
        prompt: 'Gợi ý cho tôi một bộ phim viễn tưởng hay',
        preferredProvider: 'groq',
      });

      expect(response.success).toBe(true);
      expect(response.reply).toBe(mockReply);
      expect(response.text).toBe(mockReply);
      expect(response.provider).toBe('groq');
    });

    it('should return valid reply through AiController', async () => {
      const mockReply = 'Tôi gợi ý phim Parasite của Hàn Quốc.';
      jest.spyOn(service as any, 'callGroq').mockResolvedValueOnce({
        success: true,
        text: mockReply,
        reply: mockReply,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
      });

      const response = await controller.chat({
        prompt: 'Gợi ý phim đạt giải Oscar',
      });

      expect(response.success).toBe(true);
      expect(response.reply).toBe(mockReply);
    });
  });

  describe('Provider Fallback & Error Handling', () => {
    it('should fall back to Gemini if Groq fails', async () => {
      const mockGeminiReply = 'Gemini gợi ý phim Interstellar!';
      jest.spyOn(service as any, 'callGroq').mockRejectedValueOnce(new Error('Groq 429 rate limit'));
      jest.spyOn(service as any, 'callGemini').mockResolvedValueOnce({
        success: true,
        text: mockGeminiReply,
        reply: mockGeminiReply,
        provider: 'gemini',
        model: 'gemini-1.5-flash',
      });

      const response = await service.processChat({
        prompt: 'Phim vũ trụ hay',
        preferredProvider: 'groq',
      });

      expect(response.success).toBe(true);
      expect(response.provider).toBe('gemini');
      expect(response.reply).toBe(mockGeminiReply);
    });

    it('should throw ServiceUnavailableException if both providers fail', async () => {
      jest.spyOn(service as any, 'callGroq').mockRejectedValueOnce(new Error('Groq network timeout'));
      jest.spyOn(service as any, 'callGemini').mockRejectedValueOnce(new Error('Gemini API quota exceeded'));

      await expect(
        service.processChat({ prompt: 'Test message' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('Cross-Regression & Decoupling', () => {
    it('should operate independently with zero dependency on Kafka, Tinybird, or Postgres', () => {
      // Confirmed by module definition: AiModule only imports ConfigModule, no database or telemetry dependencies
      expect(service).toBeDefined();
      expect(controller).toBeDefined();
    });
  });
});
