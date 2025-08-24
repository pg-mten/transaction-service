import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, ValidateIf } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTime } from 'src/decorator/date.decorator';

export class UpdateSettlementInternalDto {
  @ApiProperty({
    type: [Number],
    description: 'List of IDs',
    example: [1, 2, 3, 4],
  })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  merchantIds: number[];

  @ApiProperty({ type: Number })
  @IsInt()
  interval: number;

  @ApiProperty({ type: DateTime })
  @ToDateTime()
  @ValidateIf((o) => o.date !== undefined)
  @Type(() => DateTime)
  date: DateTime;
}
