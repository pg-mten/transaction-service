import { ApiProperty } from '@nestjs/swagger';
import { TransactionUserRole } from 'src/microservice/transaction.constant';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class ProfileBankByIdSystemDto {
  constructor(data: ProfileBankByIdSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: Number })
  profileId: number;

  @ApiProperty({ enum: TransactionUserRole })
  userRole: TransactionUserRole;

  @ApiProperty({ type: String })
  bankCode: string;

  @ApiProperty({ type: String })
  bankName: string;

  @ApiProperty({ type: String })
  accountNumber: string;

  @ApiProperty({ type: String })
  accountHolderName: string;
}
