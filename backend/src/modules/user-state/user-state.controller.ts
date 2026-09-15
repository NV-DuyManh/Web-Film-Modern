import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserStateService } from './user-state.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@ApiTags('user-state')
@ApiBearerAuth()
@Controller('me')
@UseGuards(FirebaseAuthGuard)
export class UserStateController {
  constructor(private readonly userStateService: UserStateService) {}

  // --- Favorites ---

  @Get('favorites')
  @ApiOperation({ summary: 'Get favorite movies for authenticated user' })
  async getFavorites(@Req() req: any) {
    return this.userStateService.getFavorites(req.user.uid);
  }

  @Post('favorites/:movieId')
  @ApiOperation({ summary: 'Add a movie to favorites' })
  async addFavorite(@Req() req: any, @Param('movieId') movieId: string) {
    return this.userStateService.addFavorite(req.user.uid, movieId);
  }

  @Delete('favorites/:movieId')
  @ApiOperation({ summary: 'Remove a movie from favorites' })
  async removeFavorite(@Req() req: any, @Param('movieId') movieId: string) {
    return this.userStateService.removeFavorite(req.user.uid, movieId);
  }

  // --- Watch History ---

  @Get('watch-history')
  @ApiOperation({ summary: 'Get watch history & resume bookmarks for user' })
  async getWatchHistory(@Req() req: any) {
    return this.userStateService.getWatchHistory(req.user.uid);
  }

  @Put('watch-history/:movieId')
  @ApiOperation({ summary: 'Update playback progress in watch history' })
  async updateWatchHistory(
    @Req() req: any,
    @Param('movieId') movieId: string,
    @Body()
    body: {
      episodeId?: string;
      progressSeconds: number;
      durationSeconds: number;
    },
  ) {
    return this.userStateService.updateWatchHistory(
      req.user.uid,
      movieId,
      body.episodeId,
      body.progressSeconds || 0,
      body.durationSeconds || 0,
    );
  }

  @Delete('watch-history/:movieId')
  @ApiOperation({ summary: 'Remove a movie from watch history' })
  async clearMovieHistory(@Req() req: any, @Param('movieId') movieId: string) {
    return this.userStateService.clearWatchHistory(req.user.uid, movieId);
  }

  @Delete('watch-history')
  @ApiOperation({ summary: 'Clear all watch history for user' })
  async clearAllHistory(@Req() req: any) {
    return this.userStateService.clearWatchHistory(req.user.uid);
  }

  // --- Playlists (Folders) ---

  @Get('playlists')
  @ApiOperation({ summary: 'Get all user playlists' })
  async getPlaylists(@Req() req: any) {
    return this.userStateService.getPlaylists(req.user.uid);
  }

  @Post('playlists')
  @ApiOperation({ summary: 'Create a new playlist' })
  async createPlaylist(@Req() req: any, @Body('name') name: string) {
    return this.userStateService.createPlaylist(req.user.uid, name || 'Danh sách mới');
  }

  @Post('playlists/:playlistId/movies/:movieId')
  @ApiOperation({ summary: 'Add a movie to a playlist' })
  async addMovieToPlaylist(
    @Req() req: any,
    @Param('playlistId') playlistId: string,
    @Param('movieId') movieId: string,
  ) {
    return this.userStateService.addMovieToPlaylist(req.user.uid, playlistId, movieId);
  }

  @Delete('playlists/:playlistId/movies/:movieId')
  @ApiOperation({ summary: 'Remove a movie from a playlist' })
  async removeMovieFromPlaylist(
    @Req() req: any,
    @Param('playlistId') playlistId: string,
    @Param('movieId') movieId: string,
  ) {
    return this.userStateService.removeMovieFromPlaylist(req.user.uid, playlistId, movieId);
  }

  @Delete('playlists/:playlistId')
  @ApiOperation({ summary: 'Delete a playlist' })
  async deletePlaylist(@Req() req: any, @Param('playlistId') playlistId: string) {
    return this.userStateService.deletePlaylist(req.user.uid, playlistId);
  }

  // --- Preferences ---

  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  async getPreferences(@Req() req: any) {
    return this.userStateService.getPreferences(req.user.uid);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  async updatePreferences(@Req() req: any, @Body() preferences: Record<string, any>) {
    return this.userStateService.updatePreferences(req.user.uid, preferences);
  }
}
