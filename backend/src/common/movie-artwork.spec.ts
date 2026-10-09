import { readFileSync } from 'fs';
import { join } from 'path';
import { resolveMovieImages, withMovieArtwork } from './movie-artwork';

describe('Movie artwork compatibility across backend and frontend', () => {
  const fixtures = JSON.parse(readFileSync(join(__dirname, 'movie-artwork-fixtures.json'), 'utf8'));
  it.each(fixtures)('resolves real artwork for $input', ({ input, expected }) => {
    expect(resolveMovieImages(input)).toEqual(expected);
  });
  it('normalizes existing SQL fields and keeps other record values', () => {
    const row = { id: 'film', img_url: '/assets/Logo6.png', banner_url: 'https://film.test/banner.webp', rent: 25000, planID: 'premium' };
    const normalized = withMovieArtwork(row);
    expect(normalized.img_url).toEqual(row.banner_url);
    expect(normalized.banner_url).toEqual(row.banner_url);
    expect(normalized.rent).toEqual(row.rent);
    expect(normalized.planID).toEqual(row.planID);
    expect(row.img_url).toEqual('/assets/Logo6.png');
  });
});
