import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaClient, TransactionTypeEnum } from '@prisma/client';
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
import { DisbursementFeeDetailDto } from './dto/disbursement-fee-detail.dto';
import { DisbursementFeeSystemDto } from 'src/microservice/config/dto-transaction-system/disbursement-fee.system.dto';
import { FeeCalculateConfigClient } from 'src/microservice/config/fee-calculate.config.client';
import { PRISMA_SERVICE } from '../prisma/prisma.provider';
import { InacashProviderClient } from 'src/microservice/provider/inacash/inacash.provider.client';
import { ProviderDisbursementSystemDto } from 'src/microservice/provider/provider-disbursement.system.dto';
import { TransactionHelper } from 'src/shared/helper/transaction.helper';

@Injectable()
export class DisbursementService {
  constructor(
    @Inject(PRISMA_SERVICE) private prisma: PrismaClient,
    private readonly feeCalculateClient: FeeCalculateConfigClient,
    private readonly balanceService: BalanceService,
    private readonly inacashProviderClient: InacashProviderClient,
  ) {}

  private readonly transactionType = TransactionTypeEnum.DISBURSEMENT;

  private async callProvider(dto: {
    code: string;
    providerName: string;
    paymentMethodName: string;
    recipientBankCode: string;
    recipientBankName: string;
    recipientAccountNumber: string;
    nominal: Decimal;
  }): Promise<ProviderDisbursementSystemDto> {
    try {
      if (dto.providerName === 'INACASH') {
        const clientRes = await this.inacashProviderClient.disbursementTCP({
          ...dto,
        });

        const clientData = clientRes.data!;
        return clientData;
      } else throw new Error('Not calling any Provider');
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async create(dto: CreateDisbursementTransactionDto) {
    const merchantId = dto.merchantId;

    // TODO Masih Hardcoded
    const providerName = 'INACASH';
    const paymentMethodName = 'TRANSFERBANK';

    const code = TransactionHelper.createCode({
      transactionType: this.transactionType,
      merchantId: dto.merchantId,
      providerName: providerName,
      paymentMethodName: paymentMethodName,
    });

    const clientData = await this.callProvider({
      code,
      providerName,
      paymentMethodName,
      ...dto,
    });

    await this.prisma.$transaction(async (trx) => {
      const feeDto =
        await this.feeCalculateClient.calculateDisbursementFeeConfigTCP({
          merchantId,
          providerName,
          paymentMethodName,
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
          externalId: code,
          merchantId: merchantId,
          providerName: providerName,
          paymentMethodName: paymentMethodName,
          recipientBankCode: dto.recipientBankCode,
          recipientBankName: dto.recipientBankName,
          recipientName: dto.recipientName,
          recipientAccount: dto.recipientName,
          nominal: dto.nominal,
          metadata: clientData.metadata as Prisma.InputJsonValue,
          netNominal: feeDto.merchantFee.netNominal,
          status: 'SUCCESS',
          MerchantBalanceLog: {
            create: {
              merchantId: dto.merchantId,
              changeAmount: dto.nominal,
              balanceActive: lastBalanceMerchant.balanceActive?.minus(
                feeDto.merchantFee.netNominal,
              ),
              balancePending: lastBalanceMerchant.balancePending,
              transactionType: this.transactionType,
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
              providerName,
              paymentMethodName,
              transactionType: this.transactionType,
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
                  transactionType: this.transactionType,
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

    const disbursementDtos: DisbursementTransactionDto[] = [];
    for (const item of items) {
      let totalFeeCut = new Decimal(0);
      const feeDetailDtos: DisbursementFeeDetailDto[] = [];
      for (const feeDetail of item.feeDetails) {
        totalFeeCut = totalFeeCut.plus(feeDetail.nominal);
        feeDetailDtos.push(new DisbursementFeeDetailDto({ ...feeDetail }));
      }
      disbursementDtos.push(
        new DisbursementTransactionDto({
          ...item,
          totalFeeCut,
          metadata: item.metadata as Record<string, unknown>,
          feeDetails: feeDetailDtos,
        }),
      );
    }

    return new Page<DisbursementTransactionDto>({
      pageable,
      total,
      data: disbursementDtos,
    });
  }
}
