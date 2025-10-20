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
  email: string;

  @ApiProperty()
  ownerName: string;

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  brandName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  nik: string;

  @ApiProperty({ type: String, required: false })
  ktpImage: string | null;

  @ApiProperty()
  npwp: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  province: string;

  @ApiProperty()
  regency: string;

  @ApiProperty()
  district: string;

  @ApiProperty()
  village: string;

  @ApiProperty()
  postalCode: string;

  @ApiProperty()
  bankCode: string;

  @ApiProperty()
  bankName: string;

  @ApiProperty()
  accountNumber: string;

  @ApiProperty()
  accountHolderName: string;

  @ApiProperty({ type: String, required: false })
  siupFile: string | null;

  @ApiProperty({ type: String, required: false })
  coordinate: string | null;
}
