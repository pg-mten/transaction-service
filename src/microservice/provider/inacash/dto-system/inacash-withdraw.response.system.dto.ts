import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class InacashWithdrawResponseSystemDto {
  constructor(data: InacashWithdrawResponseSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ToDecimalFixed()
  @ApiProperty()
  nominal: Decimal;

  @ToDecimalFixed()
  @ApiProperty()
  feeProviderRealized: Decimal;

  @ToDecimalFixed()
  @ApiProperty()
  netNominal: Decimal;

  @IsString()
  @ApiProperty()
  externalId: string;

  @IsString()
  @ApiProperty()
  accountNumber: string;

  @IsString()
  @ApiProperty()
  accountHolderName: string;

  @ApiProperty()
  metadata: Record<string, unknown>;
}
