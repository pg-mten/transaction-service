import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_AUTH } from 'src/shared/constant/client.constant';
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

  private readonly cmd = SERVICES.AUTH.cmd;

  async signatureValidation(
    filter: FilterMerchantSignatureValidationSystemDto,
  ) {
    try {
      const res = await axios.get<
        ResponseDto<MerchantSignatureValidationSystemDto>
      >(`${URL_AUTH}/merchant-signature/validation`, { params: filter });
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
          { cmd: this.cmd.merchant_signature_validation },
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
        `${URL_AUTH}/merchant-signature/internal/merchant-url`,
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
          { cmd: this.cmd.merchant_signature_url },
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
