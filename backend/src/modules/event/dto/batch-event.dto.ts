import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';

export class BatchEventDto {
  @ApiProperty({ type: [CreateEventDto], description: 'Array of streaming events (1 to 50 events per batch)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateEventDto)
  events: CreateEventDto[];
}
