import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CatalogMutationService } from './catalog-mutation.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly mutationService: CatalogMutationService,
  ) {}

  @Get('movies')
  @ApiOperation({ summary: 'Get paginated movies list from PostgreSQL' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'countryId', required: false, type: String })
  async getMovies(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('categoryId') categoryId?: string,
    @Query('countryId') countryId?: string,
  ) {
    return this.catalogService.getMovies(page, limit, categoryId, countryId);
  }

  @Get('movies/:id')
  @ApiOperation({ summary: 'Get movie by ID' })
  async getMovieById(@Param('id') id: string) {
    return this.catalogService.getMovieById(id);
  }

  @Get('movies/slug/:slug')
  @ApiOperation({ summary: 'Get movie by slug' })
  async getMovieBySlug(@Param('slug') slug: string) {
    return this.catalogService.getMovieBySlug(slug);
  }

  @Get('movies/:id/episodes')
  @ApiOperation({ summary: 'Get episodes for a movie' })
  async getEpisodes(@Param('id') id: string) {
    return this.catalogService.getEpisodesByMovieId(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('topics')
  @ApiOperation({ summary: 'Get all topics' })
  async getTopics() {
    return this.catalogService.getTopics();
  }

  // --- Dual-Write Mutation Commands (Protected: Admin Only) ---

  @Post('movies')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin create movie with dual-write replication' })
  async createMovie(
    @Body() body: any,
    @Headers('x-mutation-id') mutationId?: string,
  ) {
    return this.mutationService.mutateMovie('INSERT', body.id, body, mutationId);
  }

  @Put('movies/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin update movie with dual-write replication' })
  async updateMovie(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-mutation-id') mutationId?: string,
  ) {
    return this.mutationService.mutateMovie('UPDATE', id, body, mutationId);
  }

  @Delete('movies/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin delete movie with dual-write replication' })
  async deleteMovie(
    @Param('id') id: string,
    @Headers('x-mutation-id') mutationId?: string,
  ) {
    return this.mutationService.mutateMovie('DELETE', id, {}, mutationId);
  }

  @Post('episodes')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin create episode with dual-write replication' })
  async createEpisode(
    @Body() body: any,
    @Headers('x-mutation-id') mutationId?: string,
  ) {
    return this.mutationService.mutateEpisode('INSERT', body.id, body, mutationId);
  }

  @Put('episodes/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin update episode with dual-write replication' })
  async updateEpisode(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-mutation-id') mutationId?: string,
  ) {
    return this.mutationService.mutateEpisode('UPDATE', id, body, mutationId);
  }

  @Delete('episodes/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin delete episode with dual-write replication' })
  async deleteEpisode(
    @Param('id') id: string,
    @Headers('x-mutation-id') mutationId?: string,
  ) {
    return this.mutationService.mutateEpisode('DELETE', id, {}, mutationId);
  }
}
