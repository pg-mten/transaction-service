import { ApiProperty } from '@nestjs/swagger';
import { DtoHelper } from 'src/shared/helper/dto.helper';
import { AuthInfoDto } from '../dto/auth-info.dto';

export class MerchantValidateSignatureSystemDto {
  constructor(data: MerchantValidateSignatureSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  merchantId: number;

  @ApiProperty()
  authInfo: AuthInfoDto;
}
