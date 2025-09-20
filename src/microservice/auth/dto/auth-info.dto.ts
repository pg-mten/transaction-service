import { ApiProperty } from '@nestjs/swagger';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class AuthInfoDto {
  constructor(data: AuthInfoDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  // @Expose()
  userId: number;

  @ApiProperty()
  // @Expose()
  role: string;

  @ApiProperty()
  // @Expose()
  profileId: number;
}
