import {
  BadGatewayException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { ResponseException } from 'src/exception/response.exception';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { FilterWithdrawDto } from './dto/filter-withdraw.dto';
import { CreateWithdrawTransactionDto } from './dto/create-withdraw-transaction.dto';
import { WithdrawTransactionDto } from './dto/withdraw-transaction.dto';
import { BalanceService } from '../balance/balance.service';
import Decimal from 'decimal.js';
import { WithdrawFeeDetailDto } from './dto/withdraw-fee-detail.dto';
import { UuidHelper } from 'src/shared/helper/uuid.helper';
import { WithdrawFeeSystemDto } from 'src/microservice/config/dto-transaction-system/withdraw-fee.system.dto';
import { FeeCalculateConfigClient } from 'src/microservice/config/fee-calculate.config.client';
import { InacashProviderClient } from 'src/microservice/provider/inacash/inacash.provider.client';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderWithdrawSystemDto } from 'src/microservice/provider/provider-withdraw.system.dto';
import { TransactionHelper } from 'src/shared/helper/transaction.helper';
import { UpdateWithdrawCallbackSystemDto } from 'src/microservice/transaction/withdraw/dto-system/update-withdraw-callback.system.dto';
import { PdnProviderClient } from 'src/microservice/provider/pdn/pdn.provider.client';

@Injectable()
export class WithdrawService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feeCalculateClient: FeeCalculateConfigClient,
    private readonly balanceService: BalanceService,
    private readonly inacashProviderClient: InacashProviderClient,
    private readonly pdnProviderClient: PdnProviderClient,
  ) {}

  private readonly transactionType = TransactionTypeEnum.WITHDRAW;

  private async callProvider(dto: {
    code: string;
    providerName: string;
    paymentMethodName: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    nominal: Decimal;
  }): Promise<ProviderWithdrawSystemDto> {
    try {
      if (dto.providerName === 'PDN') {
        const clientRes = await this.pdnProviderClient.withdrawTCP({
          ...dto,
        });
        return clientRes.data!;
      } else if (dto.providerName === 'INACASH') {
        const clientRes = await this.inacashProviderClient.withdrawTCP({
          ...dto,
        });
        return clientRes.data!;
      } else
        throw ResponseException.fromHttpExecption(
          new BadGatewayException('Provider Name Not Found'),
        );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async create(dto: CreateWithdrawTransactionDto) {
    const merchantId = dto.merchantId;

    // TODO Ambil dari config service, untuk menentukan secara otomatis. Dia memakai provider dan payment method apa
    const providerName = 'PDN';
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

    const clientDataStatus = clientData.status as TransactionStatusEnum;
    if (clientDataStatus === TransactionStatusEnum.FAILED)
      return this.createFailed(clientData, dto);

    await this.prisma.$transaction(async (trx) => {
      const feeDto =
        await this.feeCalculateClient.calculateWithdrawFeeConfigTCP({
          merchantId,
          providerName,
          paymentMethodName,
          nominal: dto.nominal,
        });

      const withdraw = await trx.withdrawTransaction.create({
        data: {
          code: code,
          externalId: clientData.externalId,
          referenceId: UuidHelper.v4(),
          merchantId,
          providerName,
          paymentMethodName,
          nominal: dto.nominal,
          metadata: clientData.metadata as Prisma.InputJsonValue,
          netNominal: feeDto.merchantFee.netNominal,
          status: clientData.status as TransactionStatusEnum,
        },
      });

      if (clientData.status === TransactionStatusEnum.SUCCESS) {
        const withdrawFeeDetails =
          await trx.withdrawFeeDetail.createManyAndReturn({
            data: this.feeDetailMapper({
              withdrawId: withdraw.id,
              feeDto,
            }),
          });
        console.log({ withdrawFeeDetails });

        await this.createBalanceLog({
          withdrawId: withdraw.id,
          merchantId,
          providerName,
          paymentMethodName,
          nominal: dto.nominal,
          feeDto,
        });
      }

      console.log({ withdraw, feeDto });

      return;
    });
  }

  async callback(dto: UpdateWithdrawCallbackSystemDto) {
    const codeExtract = TransactionHelper.extractCode(dto.code);

    await this.prisma.$transaction(async (trx) => {
      const withdraw = await trx.withdrawTransaction.update({
        where: {
          code: dto.code,
          merchantId: codeExtract.merchantId,
          externalId: dto.externalId,
        },
        data: {
          status: dto.status as TransactionStatusEnum,
        },
      });

      if (withdraw.status === TransactionStatusEnum.SUCCESS) {
        const feeDto =
          await this.feeCalculateClient.calculateWithdrawFeeConfigTCP({
            merchantId: withdraw.merchantId,
            providerName: withdraw.providerName,
            paymentMethodName: withdraw.paymentMethodName,
            nominal: withdraw.nominal,
          });

        const withdrawFeeDetails =
          await trx.withdrawFeeDetail.createManyAndReturn({
            data: this.feeDetailMapper({
              withdrawId: withdraw.id,
              feeDto,
            }),
          });
        console.log({ withdrawFeeDetails });

        await this.createBalanceLog({
          withdrawId: withdraw.id,
          merchantId: withdraw.id,
          providerName: withdraw.providerName,
          paymentMethodName: withdraw.paymentMethodName,
          nominal: withdraw.nominal,
          feeDto,
        });
      }
    });
  }

  private async createFailed(
    clientData: ProviderWithdrawSystemDto,
    dto: CreateWithdrawTransactionDto,
  ) {
    const { merchantId, providerName, paymentMethodName } =
      TransactionHelper.extractCode(clientData.code);

    const withdraw = await this.prisma.withdrawTransaction.create({
      data: {
        code: clientData.code,
        externalId: clientData.externalId,
        merchantId: merchantId,
        providerName: providerName,
        paymentMethodName: paymentMethodName,

        nominal: dto.nominal,
        netNominal: new Decimal(0),
        metadata: clientData.metadata as Prisma.InputJsonValue,
        status: TransactionStatusEnum.FAILED, ///
      },
    });

    return withdraw;
  }

  private async createBalanceLog(dto: {
    withdrawId: number;
    merchantId: number;
    providerName: string;
    paymentMethodName: string;
    nominal: Decimal;
    feeDto: WithdrawFeeSystemDto;
  }) {
    const agentIds: number[] = dto.feeDto.agentFee.agents.map(
      (agent) => agent.id,
    );
    const lastBalanceMerchant = await this.balanceService.checkBalanceMerchant(
      dto.merchantId,
    );
    const lastBalanceInternal =
      await this.balanceService.checkBalanceInternal();
    const lastBalanceAgents =
      await this.balanceService.checkBalanceAgents(agentIds);

    /// TODO ResponseException ValidityLogic (statusCode: 419 / 422 / 400)
    if (lastBalanceMerchant.balanceActive <= dto.nominal) {
      throw new Error('Balance Tidak Mencukupi');
    }

    return Promise.all([
      this.prisma.merchantBalanceLog.create({
        data: {
          transactionType: this.transactionType,
          withdrawId: dto.withdrawId,
          merchantId: dto.merchantId,
          changeAmount: dto.nominal,
          balanceActive: lastBalanceMerchant.balanceActive?.minus(
            dto.feeDto.merchantFee.netNominal,
          ),
          balancePending: lastBalanceMerchant.balancePending,
        },
      }),

      this.prisma.internalBalanceLog.create({
        data: {
          transactionType: this.transactionType,
          withdrawId: dto.withdrawId,
          merchantId: dto.merchantId,
          changeAmount: dto.feeDto.internalFee.nominal,
          balanceActive: lastBalanceInternal.balanceActive?.plus(
            dto.feeDto.internalFee.nominal,
          ),
          balancePending: lastBalanceInternal.balancePending,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
        },
      }),

      this.prisma.agentBalanceLog.createMany({
        skipDuplicates: true,
        // data: [{}]
        data: dto.feeDto.agentFee.agents.map((item) => {
          return {
            transactionType: this.transactionType,
            withdrawId: dto.withdrawId,
            agentId: item.id,
            changeAmount: item.nominal,
            balancePending:
              lastBalanceAgents.find((a) => a.agentId == item.id)
                ?.balancePending || new Decimal(0),
            balanceActive:
              lastBalanceAgents
                .find((a) => a.agentId == item.id)
                ?.balanceActive.plus(item.nominal) || new Decimal(0),
          } as Prisma.AgentBalanceLogCreateManyInput;
        }),
      }),
    ]);
  }

  private feeDetailMapper({
    withdrawId,
    feeDto,
  }: {
    withdrawId: number;
    feeDto: WithdrawFeeSystemDto;
  }): Prisma.WithdrawFeeDetailCreateManyInput[] {
    const result: Prisma.WithdrawFeeDetailCreateManyInput[] = [];
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
      withdrawId,
      type: 'MERCHANT',
      feePercentage: merchantFee.feePercentage,
      feeFixed: new Decimal(0),
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      withdrawId,
      type: 'PROVIDER',
      feeFixed: providerFee.feeFixed,
      feePercentage: providerFee.feePercentage,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      withdrawId,
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
        withdrawId,
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
    return this.prisma.withdrawTransaction.findUniqueOrThrow({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findAll(pageable: Pageable, query: FilterWithdrawDto) {
    const { from, to, merchantId, providerName, paymentMethodName, status } =
      query;

    const fromDate = from
      ? startOfDay(from.toJSDate())
      : subDays(DateHelper.nowDate(), 7);
    const toDate = to
      ? endOfDay(to.toJSDate())
      : endOfDay(DateHelper.nowDate());

    const whereClause: Prisma.WithdrawTransactionWhereInput = {
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
      this.prisma.withdrawTransaction.count({
        where: whereClause,
      }),
      this.prisma.withdrawTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          feeDetails: true,
        },
      }),
    ]);

    const withdrawDtos: WithdrawTransactionDto[] = [];
    for (const item of items) {
      let totalFeeCut = new Decimal(0);
      const feeDetailDtos: WithdrawFeeDetailDto[] = [];
      for (const feeDetail of item.feeDetails) {
        totalFeeCut = totalFeeCut.plus(feeDetail.nominal);
        feeDetailDtos.push(new WithdrawFeeDetailDto({ ...feeDetail }));
      }
      withdrawDtos.push(
        new WithdrawTransactionDto({
          ...item,
          totalFeeCut,
          metadata: item.metadata as Record<string, unknown>,
          feeDetails: feeDetailDtos,
        }),
      );
    }

    return new Page<WithdrawTransactionDto>({
      pageable,
      total,
      data: withdrawDtos,
    });
  }
}
