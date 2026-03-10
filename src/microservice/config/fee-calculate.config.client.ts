import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { firstValueFrom } from 'rxjs';
import { FilterPurchaseFeeSystemDto } from './dto-transaction-system/filter-purchase-fee.system.dto';
import { PurchaseFeeSystemDto } from './dto-transaction-system/purchase-fee.system.dto';
import { FilterWithdrawFeeSystemDto } from './dto-transaction-system/filter-withdraw-fee.system.dto';
import { WithdrawFeeSystemDto } from './dto-transaction-system/withdraw-fee.system.dto';
import { FilterTopupFeeSystemDto } from './dto-transaction-system/filter-topup-fee.system.dto';
import { TopupFeeSystemDto } from './dto-transaction-system/topup-fee.system.dto';
import { FilterDisbursementFeeSystemDto } from './dto-transaction-system/filter-disbursement-fee.system.dto';
import { DisbursementFeeSystemDto } from './dto-transaction-system/disbursement-fee.system.dto';
import { SERVICES } from 'src/shared/constant/client.constant';
import { DependencyErrorHelper } from 'src/shared/helper';
import { DependencyErrorContext } from 'src/shared/exception';

@Injectable()
export class FeeCalculateConfigClient {
  constructor(
    @Inject(SERVICES.CONFIG.name)
    private readonly configClient: ClientProxy,
  ) { }

  private readonly point = SERVICES.CONFIG.point;

  /**
   * Purchase
   */
  async calculatePurchaseFeeConfig(filter: FilterPurchaseFeeSystemDto) {
    try {
      const res = await axios.get<ResponseDto<PurchaseFeeSystemDto>>(
        this.point.calculate_fee_purchase.url,
        {
          params: filter,
        },
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.config.purchaseFeeLookup,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.config.purchaseFeeLookup,
      );
    }
  }

  async calculatePurchaseFeeConfigTCP(filter: FilterPurchaseFeeSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
        this.configClient.send<PurchaseFeeSystemDto>(
          { cmd: this.point.calculate_fee_purchase.cmd },
          filter,
        ),
        ),
      () => this.calculatePurchaseFeeConfig(filter),
      DependencyErrorContext.config.purchaseFeeLookup,
    );
  }

  /**
   * Withdraw
   */
  async calculateWithdrawFeeConfig(filter: FilterWithdrawFeeSystemDto) {
    try {
      const res = await axios.get<ResponseDto<WithdrawFeeSystemDto>>(
        this.point.calculate_fee_withdraw.url,
        {
          params: filter,
        },
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.config.withdrawFeeLookup,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.config.withdrawFeeLookup,
      );
    }
  }

  async calculateWithdrawFeeConfigTCP(filter: FilterWithdrawFeeSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
        this.configClient.send<WithdrawFeeSystemDto>(
          { cmd: this.point.calculate_fee_withdraw.cmd },
          filter,
        ),
        ),
      () => this.calculateWithdrawFeeConfig(filter),
      DependencyErrorContext.config.withdrawFeeLookup,
    );
  }

  /**
   * Topup
   */
  async calculateTopupFeeConfig(filter: FilterTopupFeeSystemDto) {
    try {
      const res = await axios.get<ResponseDto<TopupFeeSystemDto>>(
        this.point.calculate_fee_topup.url,
        {
          params: filter,
        },
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.config.topupFeeLookup,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.config.topupFeeLookup,
      );
    }
  }

  async calculateTopupFeeConfigTCP(filter: FilterTopupFeeSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
        this.configClient.send<TopupFeeSystemDto>(
          { cmd: this.point.calculate_fee_topup.cmd },
          filter,
        ),
        ),
      () => this.calculateTopupFeeConfig(filter),
      DependencyErrorContext.config.topupFeeLookup,
    );
  }

  /**
   * Disbursement
   */
  async calculateDisbursementFeeConfig(filter: FilterDisbursementFeeSystemDto) {
    try {
      const res = await axios.get<ResponseDto<DisbursementFeeSystemDto>>(
        this.point.calculate_fee_disbursement.url,
        {
          params: filter,
        },
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.config.disbursementFeeLookup,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.config.disbursementFeeLookup,
      );
    }
  }

  async calculateDisbursementFeeConfigTCP(
    filter: FilterDisbursementFeeSystemDto,
  ) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
        this.configClient.send<DisbursementFeeSystemDto>(
          { cmd: this.point.calculate_fee_disbursement.cmd },
          filter,
        ),
        ),
      () => this.calculateDisbursementFeeConfig(filter),
      DependencyErrorContext.config.disbursementFeeLookup,
    );
  }
}
