import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTime } from 'src/shared/decorator';

export class UpdateWithdrawCallbackSystemDto {
  @IsString()
  @ApiProperty()
  externalId: string;

  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @ApiProperty()
  status: string;

  @IsOptional()
  @ApiProperty({ nullable: true })
  @ToDateTime()
  paidAt: DateTime | null;
}
