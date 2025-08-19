import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculateService } from '../fee/fee-calculate.service';
import { TopupFeeDto } from '../fee/dto/topup-fee.dto';
import { Prisma } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { ResponseException } from 'src/exception/response.exception';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { CreateDisbursementTransactionDto } from './dto/create-disbursement-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { FeeDetailDto } from './dto/fee-details';
import { DisbursementFeeDto } from '../fee/dto/disbursement-fee-dto';
import { DisbursementTransactionDto } from './dto/disbursement-transaction.dto';

@Injectable()
export class DisbursementTransactionService {
  constructor(
    private prisma: PrismaService,
    private feeCalculateService: FeeCalculateService,
  ) {}

  async checkBalanceMerchant(merchantId: number) {
    const lastRow = await this.prisma.merchantBalanceLog.findFirst({
      where: {
        merchantId,
      },
      orderBy: {
        createdAt: 'desc',
        id: 'desc',
      },
    });
    return lastRow?.balanceAfter;
  }

  async checkBalanceAgent(agentId: number) {
    const lastRow = await this.prisma.agentBalanceLog.findFirst({
      where: {
        agentId,
      },
      orderBy: {
        createdAt: 'desc',
        id: 'desc',
      },
    });
    return lastRow?.balanceAfter;
  }

  async createDisbursementTransaction(dto: CreateDisbursementTransactionDto) {
    await this.prisma.$transaction(async (trx) => {
      const feeDto: TopupFeeDto =
        await this.feeCalculateService.calculateFeeConfig({
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
        });

      const transaction = await trx.disbursementTransaction.create({
        data: {
          externalId: dto.externalId,
          referenceId: dto.referenceId,
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          recipientBank: dto.recipientBank,
          recipientName: dto.recipientName,
          recipientAccount: dto.recipientName,
          nominal: dto.nominal,
          metadata: dto.metadata,
          netNominal: feeDto.merchantFee.netNominal,
          status: 'PENDING',
        },
      });

      const feeDetailCreateManyInput: Prisma.DisbursementFeeDetailCreateManyInput[] =
        this.feeDetailMapper({
          disbursementTransactionId: transaction.id,
          feeDto,
        });
      const disbursementFeeDetails =
        await trx.disbursementFeeDetail.createManyAndReturn({
          data: feeDetailCreateManyInput,
        });

      console.log({ transaction, feeDto, disbursementFeeDetails });

      return;
    });
  }
  private feeDetailMapper({
    disbursementTransactionId,
    feeDto,
  }: {
    disbursementTransactionId: string;
    feeDto: DisbursementFeeDto;
  }): Prisma.DisbursementFeeDetailCreateManyInput[] {
    const result: Prisma.DisbursementFeeDetailCreateManyInput[] = [];
    const { merchantFee, agentFee, providerFee, internalFee } = feeDto;
    if (!merchantFee || !agentFee || !providerFee || !internalFee) {
      throw ResponseException.fromHttpExecption(
        new UnprocessableEntityException('Some of the response is null'),
        {
          merchantFee,
          agentFee,
          providerFee,
          internalFee,
        },
      );
    }

    /**
     * Merchant
     */
    result.push({
      disbursementTransactionId,
      type: 'MERCHANT',
      isPercentage: true,
      fee: merchantFee.feePercentage,
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      disbursementTransactionId,
      type: 'PROVIDER',
      isPercentage: providerFee.isPercentage,
      fee: providerFee.fee,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      disbursementTransactionId,
      type: 'INTERNAL',
      isPercentage: internalFee.isPercentage,
      fee: internalFee.fee,
      nominal: internalFee.nominal,
    });

    /**
     * Agent
     */
    for (const agentFeeEach of agentFee.agents) {
      result.push({
        disbursementTransactionId,
        type: 'AGENT',
        agentId: agentFeeEach.id,
        isPercentage: true,
        fee: agentFeeEach.feePercentage,
        nominal: agentFeeEach.nominal,
      });
    }

    return result;
  }

  async findOneThrow(id: string) {
    return this.prisma.disbursementTransaction.findUniqueOrThrow({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findAll(pageable: Pageable, query: FilterTransactionDto) {
    const { from, to, merchantId, providerName, paymentMethodName, status } =
      query;
    const { skip, take } = paging(pageable);

    const fromDate = from
      ? startOfDay(from.toJSDate())
      : subDays(DateHelper.nowDate(), 7);
    const toDate = to
      ? endOfDay(to.toJSDate())
      : endOfDay(DateHelper.nowDate());

    const whereClause: Prisma.DisbursementTransactionWhereInput = {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (merchantId) whereClause.merchantId = merchantId;
    if (providerName) whereClause.providerName = providerName;
    if (status) whereClause.status = status;
    if (paymentMethodName) whereClause.paymentMethodName = paymentMethodName;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.disbursementTransaction.count({
        where: whereClause,
      }),
      this.prisma.disbursementTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          feeDetails: true,
        },
      }),
    ]);
    const data = items.map((item) => {
      return new DisbursementTransactionDto({
        ...item,
        metadata: item.metadata as Record<string, unknown>,
        feeDetails: item.feeDetails.map((fee) => {
          return new FeeDetailDto({ ...fee });
        }),
      });
    });
    return new Page<DisbursementTransactionDto>({
      data: data,
      pageable,
      total,
    });
  }
}
