import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('sign')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate signed parameters for secure Cloudinary upload' })
  generateSign(@Body('folder') folder?: string) {
    return this.mediaService.generateUploadSignature(folder);
  }

  @Delete(':publicId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Securely delete a Cloudinary asset (Admin only)' })
  async deleteAsset(@Param('publicId') publicId: string, @Req() req: any) {
    const requestedBy = req.user?.uid || 'unknown_admin';
    return this.mediaService.deleteAsset(publicId, requestedBy);
  }
}
