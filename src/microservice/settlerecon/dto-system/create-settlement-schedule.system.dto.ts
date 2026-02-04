import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, ValidateIf } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTime } from 'src/shared/decorator/date.decorator';

export class CreateSettlementScheduleSystemDto {
  @ApiProperty()
  @IsString()
  merchantIds: string;

  @ApiProperty({ type: Number })
  @IsInt()
  interval: number;

  @ApiProperty({ type: DateTime })
  @ToDateTime()
  @ValidateIf((o) => o.date !== undefined)
  @Type(() => DateTime)
  date: DateTime;
}
