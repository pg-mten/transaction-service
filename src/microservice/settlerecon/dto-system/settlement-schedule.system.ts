import { DtoHelper } from 'src/shared/helper/dto.helper';
import { ApiProperty } from '@nestjs/swagger';

export class SettlementScheduleSystemDto {
  constructor(data: SettlementScheduleSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number, isArray: true })
  merchantIds: number[];

  @ApiProperty({ type: Number, isArray: true })
  merchantIdsNoSettlement: number[];
}
