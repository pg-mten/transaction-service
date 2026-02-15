import { Test, TestingModule } from '@nestjs/testing';
import { TopupService } from './topup.service';
import { FeeCalculateConfigClient } from 'src/microservice/config/fee-calculate.config.client';
import { BalanceService } from '../balance/balance.service';
import { PRISMA_SERVICE } from '../prisma/prisma.provider';
import { Decimal } from 'decimal.js';
import { TransactionStatusEnum } from '@prisma/client';
import { ResponseException } from 'src/shared/exception';

describe('TopupService', () => {
  let service: TopupService;

  const mockPrisma = {
    $transaction: jest.fn(),
    topUpTransaction: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    topupFeeDetail: {
      createManyAndReturn: jest.fn(),
    },
    merchantBalanceLog: { create: jest.fn() },
    internalBalanceLog: { create: jest.fn() },
    agentBalanceLog: { create: jest.fn() },
  };

  const mockFeeClient = {
    calculateTopupFeeConfigTCP: jest.fn(),
  };

  const mockBalanceService = {
    checkBalanceMerchant: jest.fn(),
    checkBalanceAgents: jest.fn(),
    checkBalanceInternal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopupService,
        { provide: PRISMA_SERVICE, useValue: mockPrisma },
        { provide: FeeCalculateConfigClient, useValue: mockFeeClient },
        { provide: BalanceService, useValue: mockBalanceService },
      ],
    }).compile();

    service = module.get<TopupService>(TopupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ──────────────────────────────────────────────────────

  describe('create', () => {
    const baseFeeDto = {
      merchantFee: {
        id: 1,
        nominal: new Decimal(10000),
        netNominal: new Decimal(9000),
        feePercentage: new Decimal(10),
      },
      agentFee: {
        nominal: new Decimal(0),
        feeFixed: new Decimal(0),
        feePercentage: new Decimal(0),
        agents: [],
      },
      providerFee: {
        name: 'INTERNAL',
        nominal: new Decimal(100),
        feeFixed: new Decimal(100),
        feePercentage: new Decimal(0),
      },
      internalFee: {
        nominal: new Decimal(900),
        feeFixed: new Decimal(900),
        feePercentage: new Decimal(0),
      },
    };

    it('should create topup transaction with receiptImage', async () => {
      const dto = {
        merchantId: 1,
        nominal: new Decimal(10000),
        receiptImage: 'http://example.com/image.jpg',
      };

      mockFeeClient.calculateTopupFeeConfigTCP.mockResolvedValue(baseFeeDto);
      mockPrisma.$transaction.mockImplementation(
        (cb: (trx: unknown) => unknown) => cb(mockPrisma),
      );
      mockPrisma.topUpTransaction.create.mockResolvedValue({ id: 1 });
      mockPrisma.topupFeeDetail.createManyAndReturn.mockResolvedValue([]);

      await service.create(dto);

      expect(mockFeeClient.calculateTopupFeeConfigTCP).toHaveBeenCalledWith({
        merchantId: 1,
        providerName: 'INTERNAL',
        paymentMethodName: 'TRANSFERBANK',
        nominal: new Decimal(10000),
      });
      expect(mockPrisma.topUpTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            merchantId: 1,
            nominal: new Decimal(10000),
            receiptImage: 'http://example.com/image.jpg',
            netNominal: new Decimal(9000),
            status: 'PENDING',
            providerName: 'INTERNAL',
            paymentMethodName: 'TRANSFERBANK',
          }),
        }),
      );
      expect(mockPrisma.topupFeeDetail.createManyAndReturn).toHaveBeenCalled();
    });

    it('should create topup with default receiptImage when null', async () => {
      const dto = {
        merchantId: 2,
        nominal: new Decimal(20000),
        receiptImage: null,
      };

      mockFeeClient.calculateTopupFeeConfigTCP.mockResolvedValue(baseFeeDto);
      mockPrisma.$transaction.mockImplementation(
        (cb: (trx: unknown) => unknown) => cb(mockPrisma),
      );
      mockPrisma.topUpTransaction.create.mockResolvedValue({ id: 2 });
      mockPrisma.topupFeeDetail.createManyAndReturn.mockResolvedValue([]);

      await service.create(dto);

      expect(mockPrisma.topUpTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            receiptImage: 'www.google.com', // default fallback
          }),
        }),
      );
    });
  });

  // ─── feeDetailMapper (tested via private access) ─────────────────

  describe('feeDetailMapper', () => {
    it('should map all fee types without agents (3 entries)', () => {
      const feeDto = {
        merchantFee: {
          id: 1,
          nominal: new Decimal(10000),
          netNominal: new Decimal(9000),
          feePercentage: new Decimal(10),
        },
        agentFee: {
          nominal: new Decimal(0),
          feeFixed: new Decimal(0),
          feePercentage: new Decimal(0),
          agents: [],
        },
        providerFee: {
          name: 'INTERNAL',
          nominal: new Decimal(100),
          feeFixed: new Decimal(100),
          feePercentage: new Decimal(0),
        },
        internalFee: {
          nominal: new Decimal(900),
          feeFixed: new Decimal(900),
          feePercentage: new Decimal(0),
        },
      };

      const result = (service as any).feeDetailMapper({ topupId: 1, feeDto });

      expect(result).toHaveLength(3);

      // MERCHANT
      expect(result[0]).toEqual({
        topupId: 1,
        type: 'MERCHANT',
        feePercentage: new Decimal(10),
        feeFixed: new Decimal(0),
        nominal: new Decimal(9000),
      });

      // PROVIDER
      expect(result[1]).toEqual({
        topupId: 1,
        type: 'PROVIDER',
        feeFixed: new Decimal(100),
        feePercentage: new Decimal(0),
        nominal: new Decimal(100),
      });

      // INTERNAL
      expect(result[2]).toEqual({
        topupId: 1,
        type: 'INTERNAL',
        feeFixed: new Decimal(900),
        feePercentage: new Decimal(0),
        nominal: new Decimal(900),
      });
    });

    it('should include agent entries when agents are present', () => {
      const feeDto = {
        merchantFee: {
          id: 1,
          nominal: new Decimal(10000),
          netNominal: new Decimal(9000),
          feePercentage: new Decimal(10),
        },
        agentFee: {
          nominal: new Decimal(200),
          feeFixed: new Decimal(100),
          feePercentage: new Decimal(2),
          agents: [
            { id: 1, nominal: new Decimal(100), feePercentage: new Decimal(1) },
            { id: 2, nominal: new Decimal(100), feePercentage: new Decimal(1) },
          ],
        },
        providerFee: {
          name: 'INTERNAL',
          nominal: new Decimal(100),
          feeFixed: new Decimal(100),
          feePercentage: new Decimal(0),
        },
        internalFee: {
          nominal: new Decimal(600),
          feeFixed: new Decimal(600),
          feePercentage: new Decimal(0),
        },
      };

      const result = (service as any).feeDetailMapper({ topupId: 5, feeDto });

      expect(result).toHaveLength(5); // MERCHANT + PROVIDER + INTERNAL + 2 AGENTS

      // Agent entries
      const agentEntries = result.filter((r: any) => r.type === 'AGENT');
      expect(agentEntries).toHaveLength(2);
      expect(agentEntries[0]).toEqual({
        topupId: 5,
        type: 'AGENT',
        agentId: 1,
        feeFixed: new Decimal(200), // agentFee.nominal
        feePercentage: new Decimal(1),
        nominal: new Decimal(100),
      });
      expect(agentEntries[1].agentId).toBe(2);
    });

    it('should throw ResponseException when merchantFee is null', () => {
      const feeDto = {
        merchantFee: null,
        agentFee: {
          nominal: new Decimal(0),
          feeFixed: new Decimal(0),
          feePercentage: new Decimal(0),
          agents: [],
        },
        providerFee: {
          name: 'INTERNAL',
          nominal: new Decimal(0),
          feeFixed: new Decimal(0),
          feePercentage: new Decimal(0),
        },
        internalFee: {
          nominal: new Decimal(0),
          feeFixed: new Decimal(0),
          feePercentage: new Decimal(0),
        },
      };

      expect(
        () => void (service as any).feeDetailMapper({ topupId: 1, feeDto }),
      ).toThrow(ResponseException);
    });

    it('should throw ResponseException when providerFee is null', () => {
      const feeDto = {
        merchantFee: {
          id: 1,
          nominal: new Decimal(0),
          netNominal: new Decimal(0),
          feePercentage: new Decimal(0),
        },
        agentFee: {
          nominal: new Decimal(0),
          feeFixed: new Decimal(0),
          feePercentage: new Decimal(0),
          agents: [],
        },
        providerFee: null,
        internalFee: {
          nominal: new Decimal(0),
          feeFixed: new Decimal(0),
          feePercentage: new Decimal(0),
        },
      };

      expect(
        () => void (service as any).feeDetailMapper({ topupId: 1, feeDto }),
      ).toThrow(ResponseException);
    });
  });

  // ─── findOneThrow ────────────────────────────────────────────────

  describe('findOneThrow', () => {
    it('should return the topup transaction when found', async () => {
      const mockTransaction = {
        id: 1,
        externalId: 'ext-1',
        referenceId: 'ref-1',
        merchantId: 10,
        providerName: 'INTERNAL',
        paymentMethodName: 'TRANSFERBANK',
        nominal: new Decimal(50000),
        netNominal: new Decimal(48000),
        status: TransactionStatusEnum.SUCCESS,
        metadata: { key: 'value' },
        feeDetails: [
          {
            id: 1,
            type: 'MERCHANT',
            nominal: new Decimal(2000),
            agentId: null,
          },
        ],
      };

      mockPrisma.topUpTransaction.findUniqueOrThrow.mockResolvedValue(
        mockTransaction,
      );

      const result = await service.findOneThrow(1);

      expect(result).toEqual(mockTransaction);
      expect(
        mockPrisma.topUpTransaction.findUniqueOrThrow,
      ).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { feeDetails: true },
      });
    });

    it('should throw when topup transaction not found', async () => {
      mockPrisma.topUpTransaction.findUniqueOrThrow.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(service.findOneThrow(999)).rejects.toThrow(
        'Record not found',
      );
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return empty page when no results', async () => {
      mockPrisma.$transaction.mockResolvedValue([0, []]);

      const result = await service.findAll({ page: 1, size: 10 }, {} as any);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalCount).toBe(0);
    });

    it('should return 3 items with fully-filled fields and verify DTO mapping', async () => {
      const mockItems = [
        {
          id: 1,
          externalId: 'ext-1',
          referenceId: 'ref-1',
          merchantId: 10,
          providerName: 'INTERNAL',
          paymentMethodName: 'TRANSFERBANK',
          nominal: new Decimal(50000),
          netNominal: new Decimal(48000),
          status: TransactionStatusEnum.SUCCESS,
          metadata: { key: 'value' },
          createdAt: new Date('2025-01-15T10:00:00Z'),
          feeDetails: [
            {
              id: 1,
              type: 'MERCHANT',
              nominal: new Decimal(1500),
              feeFixed: new Decimal(0),
              feePercentage: new Decimal(3),
              agentId: null,
            },
            {
              id: 2,
              type: 'PROVIDER',
              nominal: new Decimal(500),
              feeFixed: new Decimal(500),
              feePercentage: new Decimal(0),
              agentId: null,
            },
          ],
        },
        {
          id: 2,
          externalId: 'ext-2',
          referenceId: 'ref-2',
          merchantId: 20,
          providerName: 'INTERNAL',
          paymentMethodName: 'TRANSFERBANK',
          nominal: new Decimal(100000),
          netNominal: new Decimal(97000),
          status: TransactionStatusEnum.PENDING,
          metadata: { info: 'test' },
          createdAt: new Date('2025-01-16T10:00:00Z'),
          feeDetails: [
            {
              id: 3,
              type: 'INTERNAL',
              nominal: new Decimal(3000),
              feeFixed: new Decimal(1000),
              feePercentage: new Decimal(2),
              agentId: null,
            },
          ],
        },
        {
          id: 3,
          externalId: 'ext-3',
          referenceId: 'ref-3',
          merchantId: 30,
          providerName: 'INTERNAL',
          paymentMethodName: 'TRANSFERBANK',
          nominal: new Decimal(200000),
          netNominal: new Decimal(195000),
          status: TransactionStatusEnum.SUCCESS,
          metadata: { data: 'ok' },
          createdAt: new Date('2025-01-17T10:00:00Z'),
          feeDetails: [],
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([3, mockItems]);

      const result = await service.findAll({ page: 1, size: 10 }, {} as any);

      expect(result.data).toHaveLength(3);
      expect(result.pagination.totalCount).toBe(3);

      const first = result.data[0];
      expect(first.id).toBe(1);
      expect(first.merchantId).toBe(10);
      expect(first.providerName).toBe('INTERNAL');
      expect(first.totalFeeCut).toEqual(new Decimal(2000)); // 1500 + 500
      expect(first.feeDetails).toHaveLength(2);
      expect(first.metadata).toEqual({ key: 'value' });

      const second = result.data[1];
      expect(second.totalFeeCut).toEqual(new Decimal(3000));

      const third = result.data[2];
      expect(third.totalFeeCut).toEqual(new Decimal(0));
      expect(third.feeDetails).toHaveLength(0);
    });

    it('should handle items with all nullable fields set to null', async () => {
      const mockItems = [
        {
          id: 1,
          externalId: null,
          referenceId: null,
          merchantId: 10,
          providerName: 'INTERNAL',
          paymentMethodName: 'TRANSFERBANK',
          nominal: new Decimal(10000),
          netNominal: new Decimal(9500),
          status: TransactionStatusEnum.PENDING,
          metadata: null,
          createdAt: new Date('2025-01-15T10:00:00Z'),
          feeDetails: [
            {
              id: 1,
              type: 'AGENT',
              nominal: new Decimal(200),
              feeFixed: new Decimal(0),
              feePercentage: new Decimal(2),
              agentId: null,
            },
          ],
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([1, mockItems]);

      const result = await service.findAll({ page: 1, size: 10 }, {} as any);

      const item = result.data[0];
      expect(item.externalId).toBeNull();
      expect(item.referenceId).toBeNull();
      expect(item.metadata).toBeNull();
      expect(item.feeDetails[0].agentId).toBeNull();
    });

    it('should apply filters when provided', async () => {
      mockPrisma.$transaction.mockResolvedValue([0, []]);

      const query = {
        merchantId: 10,
        providerName: 'INTERNAL',
        status: TransactionStatusEnum.SUCCESS,
        paymentMethodName: 'TRANSFERBANK',
      };

      await service.findAll({ page: 1, size: 10 }, query as any);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  // ─── approveTopUp ────────────────────────────────────────────────

  describe('approveTopUp', () => {
    it('should approve topup and trigger settlement', async () => {
      const updatedItem = {
        id: 1,
        externalId: 'ext-1',
        referenceId: 'ref-1',
        merchantId: 10,
        providerName: 'INTERNAL',
        paymentMethodName: 'TRANSFERBANK',
        nominal: new Decimal(50000),
        netNominal: new Decimal(48000),
        status: TransactionStatusEnum.SUCCESS,
        metadata: { key: 'value' },
        feeDetails: [
          {
            id: 1,
            type: 'MERCHANT',
            nominal: new Decimal(2000),
            feeFixed: new Decimal(0),
            feePercentage: new Decimal(4),
            agentId: null,
          },
          {
            id: 2,
            type: 'INTERNAL',
            nominal: new Decimal(500),
            feeFixed: new Decimal(500),
            feePercentage: new Decimal(0),
            agentId: null,
          },
        ],
      };

      // The outer $transaction wraps everything
      mockPrisma.$transaction.mockImplementation((cb: unknown) => {
        // Inner trx for approveTopUp
        const trx = {
          topUpTransaction: {
            update: jest.fn().mockResolvedValue(updatedItem),
          },
          // Inner trx for settlementTopup
          merchantBalanceLog: { create: jest.fn().mockResolvedValue({}) },
          internalBalanceLog: { create: jest.fn().mockResolvedValue({}) },
          agentBalanceLog: { create: jest.fn().mockResolvedValue({}) },
        };

        // If callback, execute it
        if (typeof cb === 'function') {
          return (cb as (trx: unknown) => unknown)(trx);
        }
        return cb;
      });

      // settlementTopup calls balanceService
      mockBalanceService.checkBalanceMerchant.mockResolvedValue({
        balanceActive: new Decimal(100000),
        balancePending: new Decimal(0),
      });
      mockBalanceService.checkBalanceAgents.mockResolvedValue([]);
      mockBalanceService.checkBalanceInternal.mockResolvedValue({
        balanceActive: new Decimal(500000),
        balancePending: new Decimal(0),
      });

      await service.approveTopUp({ topupId: 1 });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockBalanceService.checkBalanceMerchant).toHaveBeenCalledWith(10);
      expect(mockBalanceService.checkBalanceInternal).toHaveBeenCalled();
    });
  });

  // ─── settlementTopup ─────────────────────────────────────────────

  describe('settlementTopup', () => {
    it('should create merchant, internal, and agent balance logs', async () => {
      const trx = {
        merchantBalanceLog: { create: jest.fn().mockResolvedValue({}) },
        internalBalanceLog: { create: jest.fn().mockResolvedValue({}) },
        agentBalanceLog: { create: jest.fn().mockResolvedValue({}) },
      };
      mockPrisma.$transaction.mockImplementation(
        (cb: (trx: unknown) => unknown) => cb(trx),
      );

      mockBalanceService.checkBalanceMerchant.mockResolvedValue({
        balanceActive: new Decimal(100000),
        balancePending: new Decimal(5000),
      });
      mockBalanceService.checkBalanceAgents.mockResolvedValue([
        {
          agentId: 1,
          balanceActive: new Decimal(20000),
          balancePending: new Decimal(0),
        },
      ]);
      mockBalanceService.checkBalanceInternal.mockResolvedValue({
        balanceActive: new Decimal(500000),
        balancePending: new Decimal(10000),
      });

      const topupDto = {
        id: 1,
        merchantId: 10,
        providerName: 'INTERNAL',
        paymentMethodName: 'TRANSFERBANK',
        nominal: new Decimal(50000),
        netNominal: new Decimal(48000),
        status: TransactionStatusEnum.SUCCESS,
        metadata: null,
        externalId: null,
        referenceId: null,
        totalFeeCut: new Decimal(2000),
        feeDetails: [
          {
            id: 1,
            type: 'MERCHANT',
            nominal: new Decimal(48000),
            feeFixed: new Decimal(0),
            feePercentage: new Decimal(4),
            agentId: null,
          },
          {
            id: 2,
            type: 'INTERNAL',
            nominal: new Decimal(500),
            feeFixed: new Decimal(500),
            feePercentage: new Decimal(0),
            agentId: null,
          },
          {
            id: 3,
            type: 'AGENT',
            nominal: new Decimal(1500),
            feeFixed: new Decimal(0),
            feePercentage: new Decimal(3),
            agentId: 1,
          },
        ],
      } as any;

      await service.settlementTopup(topupDto);

      // Merchant balance log
      expect(trx.merchantBalanceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          merchantId: 10,
          topupId: 1,
          changeAmount: new Decimal(48000),
          balanceActive: new Decimal(148000), // 100000 + 48000
          balancePending: new Decimal(5000),
          transactionType: 'TOPUP',
        }),
      });

      // Internal balance log
      expect(trx.internalBalanceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          topupId: 1,
          changeAmount: new Decimal(500),
          balanceActive: new Decimal(500500), // 500000 + 500
          balancePending: new Decimal(10000),
          merchantId: 10,
          providerName: 'INTERNAL',
          paymentMethodName: 'TRANSFERBANK',
          transactionType: 'TOPUP',
        }),
      });

      // Agent balance log
      expect(trx.agentBalanceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agentId: 1,
          topupId: 1,
          changeAmount: new Decimal(1500),
          balanceActive: new Decimal(21500), // 20000 + 1500
          balancePending: new Decimal(0),
          transactionType: 'TOPUP',
        }),
      });
    });

    it('should skip agent balance log when agentId is null', async () => {
      const trx = {
        merchantBalanceLog: { create: jest.fn().mockResolvedValue({}) },
        internalBalanceLog: { create: jest.fn().mockResolvedValue({}) },
        agentBalanceLog: { create: jest.fn().mockResolvedValue({}) },
      };
      mockPrisma.$transaction.mockImplementation(
        (cb: (trx: unknown) => unknown) => cb(trx),
      );

      mockBalanceService.checkBalanceMerchant.mockResolvedValue({
        balanceActive: new Decimal(100000),
        balancePending: new Decimal(0),
      });
      mockBalanceService.checkBalanceAgents.mockResolvedValue([]);
      mockBalanceService.checkBalanceInternal.mockResolvedValue({
        balanceActive: new Decimal(500000),
        balancePending: new Decimal(0),
      });

      const topupDto = {
        id: 1,
        merchantId: 10,
        providerName: 'INTERNAL',
        paymentMethodName: 'TRANSFERBANK',
        nominal: new Decimal(50000),
        netNominal: new Decimal(48000),
        status: TransactionStatusEnum.SUCCESS,
        metadata: null,
        externalId: null,
        referenceId: null,
        totalFeeCut: new Decimal(2000),
        feeDetails: [
          {
            id: 1,
            type: 'MERCHANT',
            nominal: new Decimal(48000),
            feeFixed: new Decimal(0),
            feePercentage: new Decimal(4),
            agentId: null,
          },
          {
            id: 2,
            type: 'INTERNAL',
            nominal: new Decimal(500),
            feeFixed: new Decimal(500),
            feePercentage: new Decimal(0),
            agentId: null,
          },
        ],
      } as any;

      await service.settlementTopup(topupDto);

      // Agent balance log should NOT be called (no AGENT fee detail)
      expect(trx.agentBalanceLog.create).not.toHaveBeenCalled();
    });
  });

  // ─── rejectTopup ─────────────────────────────────────────────────

  describe('rejectTopup', () => {
    it('should update topup status to FAILED', async () => {
      mockPrisma.topUpTransaction.update.mockResolvedValue({
        id: 1,
        status: 'FAILED',
        feeDetails: [],
        merchantId: 10,
        netNominal: new Decimal(48000),
      });

      await service.rejectTopup({ topupId: 1 });

      expect(mockPrisma.topUpTransaction.update).toHaveBeenCalledWith({
        data: { status: 'FAILED' },
        where: { id: 1, status: 'PENDING' },
        select: {
          feeDetails: true,
          merchantId: true,
          id: true,
          netNominal: true,
        },
      });
    });
  });
});
