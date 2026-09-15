import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { ConfigService } from '@nestjs/config';

describe('MediaService', () => {
  let service: MediaService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'cloudinary.cloudName') return 'test_cloud';
      if (key === 'cloudinary.apiKey') return '123456789';
      if (key === 'cloudinary.apiSecret') return 'test_secret_for_unit_test';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate valid upload signature without returning secret', () => {
    const sign = service.generateUploadSignature('movies');
    expect(sign).toBeDefined();
    expect(sign.apiKey).toEqual('123456789');
    expect(sign.cloudName).toEqual('test_cloud');
    expect(sign.folder).toEqual('movies');
    expect(sign.signature).toBeDefined();
    expect(sign.timestamp).toBeGreaterThan(0);
    // Secret must NEVER be present in the returned object
    expect((sign as any).apiSecret).toBeUndefined();
  });
});
