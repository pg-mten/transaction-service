import { ApiProperty } from '@nestjs/swagger';
import { DtoHelper } from 'src/shared/helper';

export class MerchantSignatureValidationSystemDto {
  constructor(data: MerchantSignatureValidationSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Boolean })
  isValid: boolean;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: String })
  message: string;
}
