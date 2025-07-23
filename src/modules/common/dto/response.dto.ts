import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Berhasil mengambil data' })
  message: string;

  @ApiProperty()
  data: T;
}
