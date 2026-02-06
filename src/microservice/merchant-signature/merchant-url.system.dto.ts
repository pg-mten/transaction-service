import { ApiProperty } from '@nestjs/swagger';
import { DtoHelper } from 'src/shared/helper';

export class MerchantUrlSystemDto {
  constructor(data: MerchantUrlSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  payinUrl: string | null;

  @ApiProperty()
  payoutUrl: string | null;
}
