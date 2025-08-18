import { ApiProperty } from '@nestjs/swagger';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class SettlementInternalDto {
  constructor(data: SettlementInternalDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number, isArray: true })
  merchantIds: number[];

  @ApiProperty({ type: Number, isArray: true })
  merchantIdsNoSettlement: number[];
}
