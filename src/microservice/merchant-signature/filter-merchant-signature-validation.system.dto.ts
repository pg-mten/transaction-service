import { ApiProperty } from '@nestjs/swagger';
import { MerchantSignatureHeaderDto } from './merchant-signature.header.decorator';
import { HttpMethodEnum } from 'src/shared/constant/auth.constant';
import { IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterMerchantSignatureValidationSystemDto {
  @ApiProperty()
  headers: MerchantSignatureHeaderDto;

  @ApiProperty({ enum: HttpMethodEnum })
  @IsEnum(HttpMethodEnum)
  @Transform(({ value }) => (value as string)?.toUpperCase())
  method: HttpMethodEnum;

  @ApiProperty()
  path: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  body: unknown;
}
