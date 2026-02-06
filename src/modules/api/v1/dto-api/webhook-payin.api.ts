import { ApiProperty } from '@nestjs/swagger';
import { DtoHelper } from 'src/shared/helper';

export class WebhookPayinApi {
  constructor(data: WebhookPayinApi) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number })
  purchaseId: number;

  @ApiProperty({ type: String })
  orderId: string;

  @ApiProperty({ type: String })
  amount: string;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: String })
  paidAt: string;

  @ApiProperty({ type: String })
  paymentMethod: string; // QRIS, VIRTUALACCOUNT, DIRRECTEWALLET, TRANSFERBANK, TRANSFEREWALLET
}
