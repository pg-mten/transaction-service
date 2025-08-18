import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTime } from 'src/decorator/date.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class UpdateSettlementInternalDto {
  constructor(data: UpdateSettlementInternalDto) {
    DtoHelper.assign(this, data);
  }

  @IsArray()
  @ApiProperty({ type: Number, isArray: true })
  merchantIds: number[];

  @ApiProperty({ type: Number })
  interval: number;

  @ToDateTime()
  @ApiProperty({ type: DateTime })
  date: DateTime;
}
