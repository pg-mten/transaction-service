import { ApiProperty } from '@nestjs/swagger';

export class FilterPurchaseNotSettlement {
  @ApiProperty({ type: Number })
  merchantId: number;
}
