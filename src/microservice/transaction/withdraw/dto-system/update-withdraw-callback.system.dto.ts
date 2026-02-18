import { ApiProperty } from '@nestjs/swagger';
import { DateTime } from 'luxon';
import { ToDateTime } from 'src/shared/decorator';

export class UpdateWithdrawCallbackSystemDto {
  @ApiProperty()
  externalId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  @ToDateTime()
  paidAt: DateTime;
}
