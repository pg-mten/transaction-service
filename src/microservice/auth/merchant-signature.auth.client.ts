import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_AUTH } from 'src/microservice/client.constant';
import { FilterMerchantValidateSignatureSystemDto } from './dto-system/filter-merchant-validate-signature.system.dto';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { MerchantValidateSignatureSystemDto } from './dto-system/merchant-validate-signature.system.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MerchantSignatureAuthClient {
  constructor(
    @Inject(SERVICES.AUTH.name)
    private readonly authClient: ClientProxy,
  ) {}

  private readonly cmd = SERVICES.AUTH.cmd;

  async validateSignature(filter: FilterMerchantValidateSignatureSystemDto) {
    try {
      const res = await axios.get<
        ResponseDto<MerchantValidateSignatureSystemDto>
      >(`${URL_AUTH}/merchant-detail/internal/validate-signature`, {
        params: filter,
      });
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async validateSignatureTCP(filter: FilterMerchantValidateSignatureSystemDto) {
    try {
      const res = await firstValueFrom(
        this.authClient.send<ResponseDto<MerchantValidateSignatureSystemDto>>(
          { cmd: this.cmd.merchant_validate_signature },
          filter,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
