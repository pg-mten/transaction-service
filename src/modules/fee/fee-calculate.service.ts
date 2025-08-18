import { Injectable } from '@nestjs/common';
import { FilterPurchasingFeeDto } from './dto/filter-purchasing-fee.dto';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { PurchasingFeeDto } from './dto/purchashing-fee.dto';
import { URL_CONFIG } from 'src/shared/constant/url.constant';

@Injectable()
export class FeeCalculateService {
  constructor() {}

  async calculateFeeConfig(filter: FilterPurchasingFeeDto) {
    try {
      const res = await axios.get<ResponseDto<PurchasingFeeDto>>(
        `${URL_CONFIG}/fee/purchasing`,
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
}
