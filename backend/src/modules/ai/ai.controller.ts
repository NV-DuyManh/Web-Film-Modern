import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatRequestDto } from './ai.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Proxy AI chat completions securely without exposing client API keys' })
  async chat(@Body() dto: ChatRequestDto) {
    return this.aiService.processChat(dto);
  }
}
