import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import { FilterMerchantSignatureValidationSystemDto } from './filter-merchant-signature-validation.system.dto';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { MerchantSignatureValidationSystemDto } from './merchant-signature-validation.system.dto';
import { firstValueFrom } from 'rxjs';
import { FilterMerchantUrlSystemDto } from './filter-merchant-url.system.dto';
import { MerchantUrlSystemDto } from './merchant-url.system.dto';

@Injectable()
export class MerchantSignatureAuthClient {
  constructor(
    @Inject(SERVICES.AUTH.name)
    private readonly authClient: ClientProxy,
  ) {}

  private readonly point = SERVICES.AUTH.point;

  async signatureValidation(
    filter: FilterMerchantSignatureValidationSystemDto,
  ) {
    try {
      const res = await axios.get<
        ResponseDto<MerchantSignatureValidationSystemDto>
      >(this.point.merchant_signature_validation.url, { params: filter });
      return res.data.data!;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async signatureValidationTCP(
    filter: FilterMerchantSignatureValidationSystemDto,
  ) {
    try {
      const res = await firstValueFrom(
        this.authClient.send<ResponseDto<MerchantSignatureValidationSystemDto>>(
          { cmd: this.point.merchant_signature_validation.cmd },
          filter,
        ),
      );
      return res.data!;
    } catch (error) {
      console.log(error);
      return this.signatureValidation(filter);
      throw error;
    }
  }

  async findMerchantUrl(filter: FilterMerchantUrlSystemDto) {
    try {
      const res = await axios.get<ResponseDto<MerchantUrlSystemDto>>(
        this.point.merchant_signature_url.url,
        {
          params: filter,
        },
      );
      return res.data.data!;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findMerchantUrlTCP(filter: FilterMerchantUrlSystemDto) {
    try {
      const res = await firstValueFrom(
        this.authClient.send<ResponseDto<MerchantUrlSystemDto>>(
          { cmd: this.point.merchant_signature_url.cmd },
          filter,
        ),
      );
      return res.data!;
    } catch (error) {
      console.log(error);
      return this.findMerchantUrl(filter);
      throw error;
    }
  }
}
