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

@Injectable()
export class FeeCalculateConfigClient {
  constructor(
    @Inject(SERVICES.CONFIG.name)
    private readonly configClient: ClientProxy,
  ) {}

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
      return res.data.data!;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async calculatePurchaseFeeConfigTCP(filter: FilterPurchaseFeeSystemDto) {
    try {
      const res = await firstValueFrom(
        this.configClient.send<ResponseDto<PurchaseFeeSystemDto>>(
          { cmd: this.point.calculate_fee_purchase.cmd },
          filter,
        ),
      );
      return res.data!;
    } catch (error) {
      console.error(error);
      return this.calculatePurchaseFeeConfig(filter);
      throw error;
    }
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
      return res.data.data!;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async calculateWithdrawFeeConfigTCP(filter: FilterWithdrawFeeSystemDto) {
    try {
      const res = await firstValueFrom(
        this.configClient.send<ResponseDto<WithdrawFeeSystemDto>>(
          { cmd: this.point.calculate_fee_withdraw.cmd },
          filter,
        ),
      );
      return res.data!;
    } catch (error) {
      console.error(error);
      return this.calculateWithdrawFeeConfig(filter);
      throw error;
    }
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
      return res.data.data!;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async calculateTopupFeeConfigTCP(filter: FilterTopupFeeSystemDto) {
    try {
      const res = await firstValueFrom(
        this.configClient.send<ResponseDto<TopupFeeSystemDto>>(
          { cmd: this.point.calculate_fee_topup.cmd },
          filter,
        ),
      );
      console.log({ res });
      return res.data!;
    } catch (error) {
      console.error(error);
      return this.calculateTopupFeeConfig(filter);
      throw error;
    }
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
      return res.data.data!;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async calculateDisbursementFeeConfigTCP(
    filter: FilterDisbursementFeeSystemDto,
  ) {
    try {
      const res = await firstValueFrom(
        this.configClient.send<ResponseDto<DisbursementFeeSystemDto>>(
          { cmd: this.point.calculate_fee_disbursement.cmd },
          filter,
        ),
      );
      return res.data!;
    } catch (error) {
      console.error(error);
      return this.calculateDisbursementFeeConfig(filter);
      throw error;
    }
  }
}
