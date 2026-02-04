import { ApiProperty } from '@nestjs/swagger';
import { MerchantSignatureHeaderDto } from './merchant-signature.header.decorator';

export class FilterMerchantSignatureValidationSystemDto {
  @ApiProperty()
  headers: MerchantSignatureHeaderDto;

  @ApiProperty()
  method: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  body: unknown;
}
