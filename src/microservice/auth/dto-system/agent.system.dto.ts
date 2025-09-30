import { ApiProperty } from '@nestjs/swagger';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class AgentSystemDto {
  constructor(data: AgentSystemDto) {
    DtoHelper.assign(this, data);
  }
  @ApiProperty({ type: Number })
  agentId: number;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  fullname: string;

  @ApiProperty({ type: String })
  address: string;

  @ApiProperty({ type: String })
  phone: string;

  @ApiProperty({ type: String })
  bankName: string;

  @ApiProperty({ type: String })
  accountNumber: string;

  @ApiProperty({ type: String })
  accountHolderName: string;
}
