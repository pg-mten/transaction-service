import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateAgentSystemDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  id: number;
}
