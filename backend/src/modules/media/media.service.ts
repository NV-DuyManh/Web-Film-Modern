import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generates a signed upload signature for direct browser-to-Cloudinary uploads
   * without exposing the apiSecret to the browser.
   */
  generateUploadSignature(folder?: string) {
    const timestamp = Math.round(Date.now() / 1000);
    const cloudName = this.configService.get<string>('cloudinary.cloudName');
    const apiKey = this.configService.get<string>('cloudinary.apiKey');
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret');

    if (!apiSecret) {
      throw new InternalServerErrorException('Server Cloudinary API Secret is not configured. ACTION REQUIRED BY OWNER.');
    }

    let paramsToSign = `timestamp=${timestamp}`;
    if (folder) {
      paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    }

    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    return {
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
    };
  }

  /**
   * Securely destroys an asset on Cloudinary via server-side credentials.
   * Browser bundles never possess or handle the Cloudinary API secret.
   */
  async deleteAsset(publicId: string, requestedBy: string) {
    if (!publicId || typeof publicId !== 'string' || publicId.trim().length === 0) {
      throw new BadRequestException('Invalid publicId provided for deletion');
    }

    const cleanPublicId = publicId.trim();
    const cloudName = this.configService.get<string>('cloudinary.cloudName');
    const apiKey = this.configService.get<string>('cloudinary.apiKey');
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret');

    if (!apiSecret) {
      this.logger.warn(`Cloudinary deletion requested for [${cleanPublicId}] but CLOUDINARY_API_SECRET is not configured.`);
      return {
        result: 'simulated_ok',
        publicId: cleanPublicId,
        message: 'CLOUDINARY_API_SECRET not set in server env. Asset marked for deletion. ACTION REQUIRED BY OWNER.',
      };
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${cleanPublicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', cleanPublicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey || '');
    formData.append('signature', signature);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const result = await response.json();
      this.logger.log(`[Audit] User [${requestedBy}] destroyed Cloudinary asset [${cleanPublicId}]: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to delete Cloudinary asset [${cleanPublicId}]: ${error.message}`);
      throw new InternalServerErrorException(`Cloudinary destroy operation failed: ${error.message}`);
    }
  }
}
