import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculateService } from '../fee/fee-calculate.service';
import { Prisma } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { ResponseException } from 'src/exception/response.exception';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { CreateDisbursementTransactionDto } from './dto/create-disbursement-transaction.dto';
import { FilterDisbursementDto } from './dto/filter-disbursement.dto';
import { DisbursementTransactionDto } from './dto/disbursement-transaction.dto';
import { BalanceService } from '../balance/balance.service';
import Decimal from 'decimal.js';
import { DisbursementFeeSystemDto } from '../fee/dto-transaction-system/disbursement-fee.system.dto';
import { DisbursementFeeDetailDto } from './dto/disbursement-fee-detail.dto';

@Injectable()
export class DisbursementTransactionService {
  constructor(
    private prisma: PrismaService,
    private feeCalculateService: FeeCalculateService,
    private balanceService: BalanceService,
  ) {}

  async create(dto: CreateDisbursementTransactionDto) {
    await this.prisma.$transaction(async (trx) => {
      const feeDto =
        await this.feeCalculateService.calculateDisbursementFeeConfigTCP({
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
        });

      const agentIds: number[] = feeDto.agentFee.agents.map(
        (agent) => agent.id,
      );

      const lastBalanceMerchant =
        await this.balanceService.checkBalanceMerchant(dto.merchantId);
      const lastBalanceInternal =
        await this.balanceService.aggregateBalanceInternal();
      const lastBalanceAgents =
        await this.balanceService.checkBalanceAgents(agentIds);

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
          MerchantBalanceLog: {
            create: {
              merchantId: dto.merchantId,
              changeAmount: dto.nominal,
              balanceActive: lastBalanceMerchant.balanceActive?.minus(
                feeDto.merchantFee.netNominal,
              ),
              balancePending: lastBalanceMerchant.balancePending,
              transactionType: 'DISBURSEMENT',
            },
          },
          InternalBalanceLog: {
            create: {
              changeAmount: feeDto.internalFee.nominal,
              balancePending: lastBalanceInternal.balancePending,
              merchantId: dto.merchantId,
              balanceActive: lastBalanceInternal.balanceActive?.plus(
                feeDto.internalFee.nominal,
              ),
              providerName: dto.providerName,
              paymentMethodName: dto.paymentMethodName,
              transactionType: 'DISBURSEMENT',
            },
          },
          AgentBalanceLog: {
            createMany: {
              skipDuplicates: true,
              data: feeDto.agentFee.agents.map((item) => {
                return {
                  agentId: item.id,
                  changeAmount: item.nominal,
                  balancePending:
                    lastBalanceAgents.find((a) => a.agentId == item.id)
                      ?.balancePending || new Decimal(0),
                  balanceActive:
                    lastBalanceAgents
                      .find((a) => a.agentId == item.id)
                      ?.balanceActive.plus(item.nominal) || new Decimal(0),
                  transactionType: 'DISBURSEMENT',
                };
              }),
            },
          },
        },
      });

      const feeDetailCreateManyInput: Prisma.DisbursementFeeDetailCreateManyInput[] =
        this.feeDetailMapper({
          disbursementId: transaction.id,
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
    disbursementId,
    feeDto,
  }: {
    disbursementId: number;
    feeDto: DisbursementFeeSystemDto;
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
      disbursementId,
      type: 'MERCHANT',
      feePercentage: merchantFee.feePercentage,
      feeFixed: new Decimal(0),
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      disbursementId,
      type: 'PROVIDER',
      feeFixed: providerFee.feeFixed,
      feePercentage: providerFee.feePercentage,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      disbursementId,
      type: 'INTERNAL',
      feeFixed: internalFee.feeFixed,
      feePercentage: internalFee.feePercentage,
      nominal: internalFee.nominal,
    });

    /**
     * Agent
     */
    for (const agentFeeEach of agentFee.agents) {
      result.push({
        disbursementId,
        type: 'AGENT',
        agentId: agentFeeEach.id,
        feeFixed: agentFee.nominal,
        feePercentage: agentFeeEach.feePercentage,
        nominal: agentFeeEach.nominal,
      });
    }

    return result;
  }

  async findOneThrow(id: number) {
    return this.prisma.disbursementTransaction.findUniqueOrThrow({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findAll(pageable: Pageable, query: FilterDisbursementDto) {
    const { from, to, merchantId, providerName, paymentMethodName, status } =
      query;

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

    const { skip, take } = paging(pageable);
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
          return new DisbursementFeeDetailDto({ ...fee });
        }),
      });
    });

    return new Page<DisbursementTransactionDto>({
      pageable,
      total,
      data: data,
    });
  }
}
