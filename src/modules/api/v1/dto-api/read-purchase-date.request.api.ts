import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ToDateTime } from 'src/shared/decorator';
import { DateTime } from 'luxon';

export class ReadPurchaseDateRequestApi {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  size: number;

  @ApiProperty({ type: String })
  @ToDateTime()
  @IsNotEmpty()
  from: DateTime;

  @ApiProperty({ type: String })
  @ToDateTime()
  @IsNotEmpty()
  to: DateTime;
}
