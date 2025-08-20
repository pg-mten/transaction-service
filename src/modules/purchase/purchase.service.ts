import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculateService } from '../fee/fee-calculate.service';
import { CreatePurchaseTransactionDto } from './dto/create-purchase-transaction.dto';
import { PurchasingFeeDto } from '../fee/dto/purchashing-fee.dto';
import { Prisma } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { PurchaseFeeDetailDto } from './dto/purchase-fee-detail.dto';
import { ResponseException } from 'src/exception/response.exception';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { FilterPurchaseSettlement } from './dto/filter-purchase-settlement.dto';
import { FilterPurchaseNotSettlement } from './dto/filter-purchase-not-settlement.dto';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private feePurchaseService: FeeCalculateService,
  ) {}

  async create(dto: CreatePurchaseTransactionDto) {
    await this.prisma.$transaction(async (tx) => {
      /**
       * Get Fee Config
       */
      const purchaseFeeDto: PurchasingFeeDto =
        await this.feePurchaseService.calculateFeeConfig({
          merchantId: 1,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.amount,
        });

      /**
       * Create Purchase Transaction
       */
      const purchaseTransaction = await tx.purchaseTransaction.create({
        data: {
          externalId: dto.externalId,
          referenceId: dto.referenceId,
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.amount,
          metadata: dto.metadata,
          netNominal: purchaseFeeDto.merchantFee.netNominal,
          status: 'PENDING',
        },
      });

      /**
       * Create Purchase Fee Detail
       */
      const purchaseFeeDetailManyInput: Prisma.PurchaseFeeDetailCreateManyInput[] =
        this.purchaseFeeDetailMapper({
          purchaseTransactionId: purchaseTransaction.id,
          purchaseFeeDto,
        });
      const purchsaeFeeDetails = await tx.purchaseFeeDetail.createManyAndReturn(
        {
          data: purchaseFeeDetailManyInput,
        },
      );
      console.log({ purchaseTransaction, purchaseFeeDto, purchsaeFeeDetails });

      return;
    });
  }

  private purchaseFeeDetailMapper({
    purchaseTransactionId,
    purchaseFeeDto,
  }: {
    purchaseTransactionId: string;
    purchaseFeeDto: PurchasingFeeDto;
  }): Prisma.PurchaseFeeDetailCreateManyInput[] {
    const result: Prisma.PurchaseFeeDetailCreateManyInput[] = [];
    const { merchantFee, agentFee, providerFee, internalFee } = purchaseFeeDto;
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
      purchaseTransactionId,
      type: 'MERCHANT',
      isPercentage: true,
      fee: merchantFee.feePercentage,
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      purchaseTransactionId,
      type: 'PROVIDER',
      isPercentage: providerFee.isPercentage,
      fee: providerFee.fee,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      purchaseTransactionId,
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
        purchaseTransactionId,
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
    return this.prisma.purchaseTransaction.findUniqueOrThrow({
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

    const whereClause: Prisma.PurchaseTransactionWhereInput = {
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
      this.prisma.purchaseTransaction.count({
        where: whereClause,
      }),
      this.prisma.purchaseTransaction.findMany({
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
      return new PurchaseTransactionDto({
        ...item,
        metadata: item.metadata as Record<string, unknown>,
        settlementAt: DateHelper.fromJsDate(item.settlementAt),
        reconciliationAt: DateHelper.fromJsDate(item.reconciliationAt),
        feeDetails: item.feeDetails.map((fee) => {
          return new PurchaseFeeDetailDto({ ...fee });
        }),
      });
    });
    return new Page<PurchaseTransactionDto>({
      data: data,
      pageable,
      total,
    });
  }

  async findAllNotSettlement(filter: FilterPurchaseNotSettlement) {
    const { merchantId } = filter;

    const whereClause: Prisma.PurchaseTransactionWhereInput = {};

    whereClause.settlementAt = null;
    if (merchantId) whereClause.merchantId = merchantId;

    const items = await this.prisma.purchaseTransaction.findMany({
      include: { feeDetails: true },
      where: whereClause,
    });

    return items.map((item) => {
      return new PurchaseTransactionDto({
        ...item,
        metadata: item.metadata as Record<string, unknown>,
        settlementAt: DateHelper.fromJsDate(item.settlementAt),
        reconciliationAt: DateHelper.fromJsDate(item.reconciliationAt),
        feeDetails: item.feeDetails.map((fee) => {
          return new PurchaseFeeDetailDto({ ...fee });
        }),
      });
    });
  }

  async findAllSettlement(filter: FilterPurchaseSettlement) {
    const { merchantId, from, to } = filter;

    const whereClause: Prisma.PurchaseTransactionWhereInput = {};

    whereClause.settlementAt = { not: null };
    if (merchantId) whereClause.merchantId = merchantId;

    if (from && to) {
      whereClause.createdAt = {
        gte: from.toJSDate(),
        lte: to.toJSDate(),
      };
    }

    const items = await this.prisma.purchaseTransaction.findMany({
      include: { feeDetails: true },
      where: whereClause,
    });

    return items.map((item) => {
      return new PurchaseTransactionDto({
        ...item,
        metadata: item.metadata as Record<string, unknown>,
        settlementAt: DateHelper.fromJsDate(item.settlementAt),
        reconciliationAt: DateHelper.fromJsDate(item.reconciliationAt),
        feeDetails: item.feeDetails.map((fee) => {
          return new PurchaseFeeDetailDto({ ...fee });
        }),
      });
    });
  }

  async handleWebhook(external_id: string, newStatus: string, rawPayload: any) {
    const trx = await this.prisma.purchaseTransaction.findUnique({
      where: { externalId: external_id },
    });
    if (!trx) throw new NotFoundException('Transaction not found'); // TODO

    if (['SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(trx.status)) {
      return { message: 'Transaction already finalized' };
    }

    const updated = await this.prisma.purchaseTransaction.update({
      where: { externalId: external_id },
      data: {
        status: newStatus as any,
        updatedAt: DateHelper.nowDate(),
      },
    });

    await this.prisma.purchaseTransactionAudit.create({
      data: {
        transactionId: updated.id,
        oldStatus: trx.status,
        newStatus: newStatus as any,
        source: 'webhook',
        createdAt: DateHelper.nowDate(),
      },
    });

    await this.prisma.webhookLog.create({
      data: {
        transactionId: updated.id,
        source: 'provider',
        payload: rawPayload,
        receivedAt: DateHelper.nowDate(),
      },
    });

    return { message: 'Webhook processed', status: updated.status };
  }
}
