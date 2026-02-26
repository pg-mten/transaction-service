import { ApiProperty } from '@nestjs/swagger';
import { TransactionUserRole } from 'src/shared/constant/transaction.constant';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class ProfileProviderSystemDto {
  constructor(data: ProfileProviderSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ enum: TransactionUserRole })
  userRole: TransactionUserRole;

  @ApiProperty({ type: String })
  providerName: string;

  @ApiProperty({ type: String })
  paymentMethodName: string;
}
