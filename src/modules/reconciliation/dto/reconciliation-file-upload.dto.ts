import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ReconFileUploadDto {
  @IsString()
  @ApiProperty({ required: false, example: 'NETZME' })
  providerName: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
