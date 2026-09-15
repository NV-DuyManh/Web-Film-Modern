import { IsString, IsNotEmpty, IsOptional, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ example: 'user' })
  @IsString()
  role: 'user' | 'model' | 'assistant' | 'system';

  @ApiProperty({ example: 'Xin chào MFILM AI' })
  @IsString()
  @MaxLength(4000)
  text: string;
}

export class ChatRequestDto {
  @ApiProperty({ example: 'Gợi ý cho tôi một bộ phim anime phiêu lưu hay nhất' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  prompt: string;

  @ApiPropertyOptional({ type: [ChatMessageDto] })
  @IsOptional()
  @IsArray()
  history?: ChatMessageDto[];

  @ApiPropertyOptional({ example: 'gemini' })
  @IsOptional()
  @IsString()
  preferredProvider?: 'gemini' | 'groq';

  @ApiPropertyOptional({ example: 'Bạn là trợ lý ảo MFILM...' })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  systemInstruction?: string;
}
