import { ApiProperty } from '@nestjs/swagger';

export class UpdateWithdrawCallbackSystemDto {
  @ApiProperty()
  externalId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  status: string;
}
