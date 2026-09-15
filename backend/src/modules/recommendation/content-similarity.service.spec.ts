import { Test, TestingModule } from '@nestjs/testing';
import { ContentSimilarityService } from './content-similarity.service';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

describe('ContentSimilarityService', () => {
  let service: ContentSimilarityService;
  let mockDb: any;

  const sampleMovies = [
    {
      id: 'm1',
      name: 'Naruto Shippuden',
      slug: 'naruto-shippuden',
      description: 'Anime hanh dong ninja Konoha cuoc chien ninja',
      img_url: 'https://example.com/naruto.jpg',
      banner_url: 'https://example.com/naruto_b.jpg',
      views: '5000',
      rating: '9.2',
      is_hot: true,
      country: 'Nhật Bản',
      categories: ['Hoạt Hình', 'Hành Động', 'Phiêu Lưu'],
      actors: ['Junko Takeuchi', 'Noriaki Sugiyama'],
      authors: ['Masashi Kishimoto'],
    },
    {
      id: 'm2',
      name: 'Boruto: Next Generations',
      slug: 'boruto-next-generations',
      description: 'The he tiep theo cua ninja Konoha Naruto va Sasuke',
      img_url: 'https://example.com/boruto.jpg',
      banner_url: 'https://example.com/boruto_b.jpg',
      views: '3000',
      rating: '7.8',
      is_hot: false,
      country: 'Nhật Bản',
      categories: ['Hoạt Hình', 'Hành Động', 'Phiêu Lưu'],
      actors: ['Yuko Sanpei', 'Junko Takeuchi'],
      authors: ['Masashi Kishimoto'],
    },
    {
      id: 'm3',
      name: 'One Piece Film Red',
      slug: 'one-piece-film-red',
      description: 'Hai tac Luffy va bang Mu Rom tai hon dao am nhac Uta',
      img_url: 'https://example.com/op.jpg',
      banner_url: 'https://example.com/op_b.jpg',
      views: '8000',
      rating: '9.0',
      is_hot: true,
      country: 'Nhật Bản',
      categories: ['Hoạt Hình', 'Phiêu Lưu'],
      actors: ['Mayumi Tanaka'],
      authors: ['Eiichiro Oda'],
    },
    {
      id: 'm4',
      name: 'Parasite',
      slug: 'ky-sinh-trung',
      description: 'Gia dinh ngheo kho song ky sinh vao biet thu gia dinh giau co',
      img_url: 'https://example.com/parasite.jpg',
      banner_url: 'https://example.com/parasite_b.jpg',
      views: '12000',
      rating: '9.5',
      is_hot: true,
      country: 'Hàn Quốc',
      categories: ['Tâm Lý', 'Hồi Hộp', 'Chính Kịch'],
      actors: ['Song Kang-ho', 'Choi Woo-shik'],
      authors: ['Bong Joon-ho'],
    },
  ];

  beforeEach(async () => {
    mockDb = {
      query: jest.fn().mockResolvedValue({ rows: sampleMovies }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentSimilarityService,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('true'),
          },
        },
      ],
    }).compile();

    service = module.get<ContentSimilarityService>(ContentSimilarityService);
    await service.onModuleInit();
  });

  it('should initialize and index catalog movies', () => {
    expect(service.getAllMovies().length).toBe(4);
  });

  it('should rank Boruto as highest similarity for Naruto due to shared genres, actors, and author', () => {
    const similar = service.getSimilarMovies('m1', 5);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar[0].movieId).toBe('m2'); // Boruto is most similar to Naruto
    expect(similar[0].similarityScore).toBeGreaterThan(0.5);
    expect(similar[0].reason).toContain('Cùng thể loại');
  });

  it('should give low similarity between Naruto (anime) and Parasite (Korean drama)', () => {
    const similar = service.getSimilarMovies('m1', 5);
    const parasiteMatch = similar.find((x) => x.movieId === 'm4');
    expect(parasiteMatch).toBeUndefined(); // Filtered out due to near-zero cosine similarity
  });

  it('should recommend content for seed movie IDs while respecting exclusions', () => {
    const recs = service.getRecommendationsForSeeds(['m1'], new Set(['m1', 'm2']), 5);
    // Boruto is excluded, so One Piece should be recommended next
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].movieId).toBe('m3');
  });
});
