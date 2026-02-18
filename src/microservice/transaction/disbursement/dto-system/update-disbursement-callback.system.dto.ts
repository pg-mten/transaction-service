import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTime } from 'src/shared/decorator';

export class UpdateDisbursementCallbackSystemDto {
  @IsString()
  @ApiProperty()
  externalId: string;

  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @ApiProperty()
  status: string;

  @ApiProperty()
  @IsNotEmpty()
  @ToDateTime()
  paidAt: DateTime;
}
