import { ApiProperty } from '@nestjs/swagger';

export class UpdateDisbursementCallbackSystemDto {
  @ApiProperty()
  externalId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  status: string;
}
