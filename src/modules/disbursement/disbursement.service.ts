import {
  BadGatewayException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  PrismaClient,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '@prisma/client';
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
import { UpdateDisbursementCallbackSystemDto } from 'src/microservice/transaction/disbursement/dto-system/update-disbursement-callback.system.dto';
import { PdnProviderClient } from 'src/microservice/provider/pdn/pdn.provider.client';

@Injectable()
export class DisbursementService {
  constructor(
    @Inject(PRISMA_SERVICE) private prisma: PrismaClient,
    private readonly feeCalculateClient: FeeCalculateConfigClient,
    private readonly balanceService: BalanceService,
    private readonly inacashProviderClient: InacashProviderClient,
    private readonly pdnProviderClient: PdnProviderClient,
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
      if (dto.providerName === 'PDN') {
        const clientRes = await this.pdnProviderClient.disbursementTCP({
          ...dto,
        });
        return clientRes.data!;
      } else if (dto.providerName === 'INACASH') {
        const clientRes = await this.inacashProviderClient.disbursementTCP({
          ...dto,
        });

        const clientData = clientRes.data!;
        return clientData;
      } else
        throw ResponseException.fromHttpExecption(
          new BadGatewayException('Provider Name Not Found'),
        );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async create(dto: CreateDisbursementTransactionDto) {
    const merchantId = dto.merchantId;

    // TODO Melakukan pengecekan terhadap balance yang dia punya

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
      paymentMethodName,
      providerName,
      ...dto,
    });

    const clientDataStatus = clientData.status as TransactionStatusEnum;
    if (clientDataStatus === TransactionStatusEnum.FAILED)
      return this.createFailed(clientData, dto);

    await this.prisma.$transaction(async (trx) => {
      const feeDto =
        await this.feeCalculateClient.calculateDisbursementFeeConfigTCP({
          merchantId,
          providerName,
          paymentMethodName,
          nominal: dto.nominal,
        });

      const disbursement = await trx.disbursementTransaction.create({
        data: {
          code: code,
          externalId: clientData.externalId,
          merchantId: merchantId,
          providerName: providerName,
          paymentMethodName: paymentMethodName,
          recipientBankCode: dto.recipientBankCode,
          recipientBankName: dto.recipientBankName,
          recipientName: dto.recipientName,
          recipientAccount: dto.recipientName,
          nominal: dto.nominal,
          netNominal: feeDto.merchantFee.netNominal,
          metadata: clientData.metadata as Prisma.InputJsonValue,
          status: TransactionStatusEnum.PENDING, // SUCCESS hanya dari webhook
        },
      });

      console.log({ disbursement, feeDto });

      return;
    });
  }

  async callback(dto: UpdateDisbursementCallbackSystemDto) {
    const codeExtract = TransactionHelper.extractCode(dto.code);

    await this.prisma.$transaction(async (trx) => {
      const disbursement = await trx.disbursementTransaction.update({
        where: {
          code: dto.code,
          merchantId: codeExtract.merchantId,
          externalId: dto.externalId,
        },
        data: {
          status: dto.status as TransactionStatusEnum,
        },
      });

      if (disbursement.status === TransactionStatusEnum.SUCCESS) {
        const feeDto =
          await this.feeCalculateClient.calculateDisbursementFeeConfig({
            merchantId: disbursement.merchantId,
            providerName: disbursement.providerName,
            paymentMethodName: disbursement.paymentMethodName,
            nominal: disbursement.nominal,
          });

        const disbursementFeeDetails =
          await trx.disbursementFeeDetail.createManyAndReturn({
            data: this.feeDetailMapper({
              disbursementId: disbursement.id,
              feeDto,
            }),
          });
        console.log({ disbursementFeeDetails });

        await this.createBalanceLog({
          disbursementId: disbursement.id,
          merchantId: disbursement.id,
          providerName: disbursement.providerName,
          paymentMethodName: disbursement.paymentMethodName,
          nominal: disbursement.nominal,
          feeDto,
        });
      }
    });
  }

  private async createFailed(
    clientData: ProviderDisbursementSystemDto,
    dto: CreateDisbursementTransactionDto,
  ) {
    const { merchantId, providerName, paymentMethodName } =
      TransactionHelper.extractCode(clientData.code);

    const disbursement = await this.prisma.disbursementTransaction.create({
      data: {
        code: clientData.code,
        externalId: clientData.externalId,
        merchantId: merchantId,
        providerName: providerName,
        paymentMethodName: paymentMethodName,
        recipientBankCode: dto.recipientBankCode,
        recipientBankName: dto.recipientBankName,
        recipientName: dto.recipientName,
        recipientAccount: dto.recipientName,
        nominal: dto.nominal,
        netNominal: new Decimal(0),
        metadata: clientData.metadata as Prisma.InputJsonValue,
        status: TransactionStatusEnum.FAILED, ///
      },
    });

    return disbursement;
  }

  private async createBalanceLog(dto: {
    disbursementId: number;
    merchantId: number;
    providerName: string;
    paymentMethodName: string;
    nominal: Decimal;
    feeDto: DisbursementFeeSystemDto;
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
          disbursementId: dto.disbursementId,
          merchantId: dto.merchantId,
          changeAmount: dto.nominal,
          balanceActive: lastBalanceMerchant.balanceActive?.minus(
            dto.feeDto.merchantFee.netNominal,
          ),
          balancePending: lastBalanceMerchant.balancePending,
          transactionType: this.transactionType,
        },
      }),

      this.prisma.internalBalanceLog.create({
        data: {
          disbursementId: dto.disbursementId,
          merchantId: dto.merchantId,
          changeAmount: dto.feeDto.internalFee.nominal,
          balanceActive: lastBalanceInternal.balanceActive?.plus(
            dto.feeDto.internalFee.nominal,
          ),
          balancePending: lastBalanceInternal.balancePending,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          transactionType: this.transactionType,
        },
      }),

      this.prisma.agentBalanceLog.createMany({
        skipDuplicates: true,
        data: dto.feeDto.agentFee.agents.map((item) => {
          return {
            disbursementId: dto.disbursementId,
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
          } as Prisma.AgentBalanceLogCreateManyInput;
        }),
      }),
    ]);
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
