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
import { SERVICES, URL_CONFIG } from 'src/microservice/client.constant';

@Injectable()
export class FeeCalculateConfigClient {
  constructor(
    @Inject(SERVICES.CONFIG.name)
    private readonly configClient: ClientProxy,
  ) {}

  private readonly cmd = SERVICES.CONFIG.cmd;

  /**
   * Purchase
   */
  async calculatePurchaseFeeConfig(filter: FilterPurchaseFeeSystemDto) {
    try {
      const res = await axios.get<ResponseDto<PurchaseFeeSystemDto>>(
        `${URL_CONFIG}/fee/internal/purchase`,
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
          { cmd: this.cmd.calculate_fee_purchase },
          filter,
        ),
      );
      return res.data!;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Withdraw
   */
  async calculateWithdrawFeeConfig(filter: FilterWithdrawFeeSystemDto) {
    try {
      const res = await axios.get<ResponseDto<WithdrawFeeSystemDto>>(
        `${URL_CONFIG}/fee/internal/withdraw`,
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
          { cmd: this.cmd.calculate_fee_withdraw },
          filter,
        ),
      );
      return res.data!;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Topup
   */
  async calculateTopupFeeConfig(filter: FilterTopupFeeSystemDto) {
    try {
      const res = await axios.get<ResponseDto<TopupFeeSystemDto>>(
        `${URL_CONFIG}/fee/internal/topup`,
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
          { cmd: this.cmd.calculate_fee_topup },
          filter,
        ),
      );
      console.log({ res });
      return res.data!;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Disbursement
   */
  async calculateDisbursementFeeConfig(filter: FilterDisbursementFeeSystemDto) {
    try {
      const res = await axios.get<ResponseDto<DisbursementFeeSystemDto>>(
        `${URL_CONFIG}/fee/internal/disbursement`,
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
          { cmd: this.cmd.calculate_fee_disbursement },
          filter,
        ),
      );
      return res.data!;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
