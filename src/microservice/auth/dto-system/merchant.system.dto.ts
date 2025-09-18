import { ApiProperty } from '@nestjs/swagger';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class MerchantSystemDto {
  constructor(data: MerchantSystemDto) {
    DtoHelper.assign(this, data);
  }
  @ApiProperty({ type: Number })
  merchantId: number;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: String })
  username: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  businessName: string;

  @ApiProperty({ type: String })
  npwp: string;

  @ApiProperty({ type: String })
  address: string;

  @ApiProperty({ type: String })
  bankName: string;

  @ApiProperty({ type: String })
  accountNumber: string;

  @ApiProperty({ type: String })
  accountHolderName: string;
}
