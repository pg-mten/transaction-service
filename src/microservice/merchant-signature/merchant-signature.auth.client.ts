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
import { DependencyErrorHelper } from 'src/shared/helper';
import { DependencyErrorContext } from 'src/shared/exception';

@Injectable()
export class MerchantSignatureAuthClient {
  constructor(
    @Inject(SERVICES.AUTH.name)
    private readonly authClient: ClientProxy,
  ) { }

  private readonly point = SERVICES.AUTH.point;

  async signatureValidation(
    filter: FilterMerchantSignatureValidationSystemDto,
  ) {
    try {
      const res = await axios.get<
        ResponseDto<MerchantSignatureValidationSystemDto>
      >(this.point.merchant_signature_validation.url, { params: filter });
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.auth.merchantSignatureValidation,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.auth.merchantSignatureValidation,
      );
    }
  }

  async signatureValidationTCP(
    filter: FilterMerchantSignatureValidationSystemDto,
  ) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
        this.authClient.send<MerchantSignatureValidationSystemDto>(
          { cmd: this.point.merchant_signature_validation.cmd },
          filter,
        ),
        ),
      () => this.signatureValidation(filter),
      DependencyErrorContext.auth.merchantSignatureValidation,
    );
  }

  async findMerchantUrl(filter: FilterMerchantUrlSystemDto) {
    try {
      const res = await axios.get<ResponseDto<MerchantUrlSystemDto>>(
        this.point.merchant_signature_url.url,
        {
          params: filter,
        },
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.auth.merchantUrlLookup,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.auth.merchantUrlLookup,
      );
    }
  }

  async findMerchantUrlTCP(filter: FilterMerchantUrlSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
        this.authClient.send<MerchantUrlSystemDto>(
          { cmd: this.point.merchant_signature_url.cmd },
          filter,
        ),
        ),
      () => this.findMerchantUrl(filter),
      DependencyErrorContext.auth.merchantUrlLookup,
    );
  }
}
