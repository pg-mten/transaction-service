import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseService } from './purchase.service';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';
import { TransactionStatusEnum } from '@prisma/client';

describe('PurchaseService', () => {
  let service: PurchaseService;

  const mockPrismaService = {
    purchaseTransaction: {
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PurchaseService>(PurchaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneThrow', () => {
    it('should return the purchase transaction when found', async () => {
      const mockTransaction = {
        id: 1,
        code: 'PUR-001',
        externalId: 'ext-1',
        referenceId: 'ref-1',
        merchantId: 10,
        providerName: 'PDN',
        paymentMethodName: 'TRANSFERBANK',
        nominal: new Decimal(50000),
        netNominal: new Decimal(48000),
        status: TransactionStatusEnum.SUCCESS,
        metadata: { key: 'value' },
        settlementAt: new Date('2025-01-20T10:00:00Z'),
        reconciliationAt: new Date('2025-01-21T10:00:00Z'),
        createdAt: new Date('2025-01-15T10:00:00Z'),
        feeDetails: [
          {
            id: 1,
            type: 'MERCHANT',
            nominal: new Decimal(2000),
            agentId: null,
          },
        ],
      };

      mockPrismaService.purchaseTransaction.findUniqueOrThrow.mockResolvedValue(
        mockTransaction,
      );

      const result = await service.findOneThrow(1);

      expect(result).toEqual(mockTransaction);
      expect(
        mockPrismaService.purchaseTransaction.findUniqueOrThrow,
      ).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { feeDetails: true },
      });
    });

    it('should throw when purchase transaction not found', async () => {
      mockPrismaService.purchaseTransaction.findUniqueOrThrow.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(service.findOneThrow(999)).rejects.toThrow(
        'Record not found',
      );
    });
  });

  describe('findAll', () => {
    it('should return empty page when no results', async () => {
      mockPrismaService.$transaction.mockResolvedValue([0, []]);

      const result = await service.findAll({ page: 1, size: 10 }, {} as any);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalCount).toBe(0);
    });

    it('should return 3 items with fully-filled fields and verify DTO mapping', async () => {
      const mockItems = [
        {
          id: 1,
          code: 'PUR-001',
          externalId: 'ext-1',
          referenceId: 'ref-1',
          merchantId: 10,
          providerName: 'PDN',
          paymentMethodName: 'TRANSFERBANK',
          nominal: new Decimal(50000),
          netNominal: new Decimal(48000),
          status: TransactionStatusEnum.SUCCESS,
          metadata: { key: 'value' },
          settlementAt: new Date('2025-01-20T10:00:00Z'),
          reconciliationAt: new Date('2025-01-21T10:00:00Z'),
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
          code: 'PUR-002',
          externalId: 'ext-2',
          referenceId: 'ref-2',
          merchantId: 20,
          providerName: 'INACASH',
          paymentMethodName: 'EWALLET',
          nominal: new Decimal(100000),
          netNominal: new Decimal(97000),
          status: TransactionStatusEnum.PENDING,
          metadata: { info: 'test' },
          settlementAt: new Date('2025-01-22T10:00:00Z'),
          reconciliationAt: new Date('2025-01-23T10:00:00Z'),
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
          code: 'PUR-003',
          externalId: 'ext-3',
          referenceId: 'ref-3',
          merchantId: 30,
          providerName: 'PDN',
          paymentMethodName: 'TRANSFERBANK',
          nominal: new Decimal(200000),
          netNominal: new Decimal(195000),
          status: TransactionStatusEnum.SUCCESS,
          metadata: { data: 'ok' },
          settlementAt: new Date('2025-01-24T10:00:00Z'),
          reconciliationAt: new Date('2025-01-25T10:00:00Z'),
          createdAt: new Date('2025-01-17T10:00:00Z'),
          feeDetails: [],
        },
      ];

      mockPrismaService.$transaction.mockResolvedValue([3, mockItems]);

      const result = await service.findAll({ page: 1, size: 10 }, {} as any);

      expect(result.data).toHaveLength(3);
      expect(result.pagination.totalCount).toBe(3);

      // Verify first item DTO mapping
      const first = result.data[0];
      expect(first.id).toBe(1);
      expect(first.merchantId).toBe(10);
      expect(first.providerName).toBe('PDN');
      expect(first.totalFeeCut).toEqual(new Decimal(2000)); // 1500 + 500
      expect(first.feeDetails).toHaveLength(2);
      expect(first.metadata).toEqual({ key: 'value' });
      expect(first.settlementAt).not.toBeNull();
      expect(first.reconciliationAt).not.toBeNull();

      // Verify second item
      const second = result.data[1];
      expect(second.totalFeeCut).toEqual(new Decimal(3000));

      // Verify third item with empty feeDetails
      const third = result.data[2];
      expect(third.totalFeeCut).toEqual(new Decimal(0));
      expect(third.feeDetails).toHaveLength(0);
    });

    it('should handle items with all nullable fields set to null', async () => {
      const mockItems = [
        {
          id: 1,
          code: 'PUR-N01',
          externalId: null,
          referenceId: null,
          merchantId: 10,
          providerName: 'PDN',
          paymentMethodName: 'TRANSFERBANK',
          nominal: new Decimal(10000),
          netNominal: new Decimal(9500),
          status: TransactionStatusEnum.PENDING,
          metadata: null,
          settlementAt: null,
          reconciliationAt: null,
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

      mockPrismaService.$transaction.mockResolvedValue([1, mockItems]);

      const result = await service.findAll({ page: 1, size: 10 }, {} as any);

      const item = result.data[0];
      expect(item.externalId).toBeNull();
      expect(item.referenceId).toBeNull();
      expect(item.metadata).toBeNull();
      expect(item.settlementAt).toBeNull();
      expect(item.reconciliationAt).toBeNull();
      expect(item.feeDetails[0].agentId).toBeNull();
    });

    it('should apply filters when provided', async () => {
      mockPrismaService.$transaction.mockResolvedValue([0, []]);

      const query = {
        merchantId: 10,
        providerName: 'PDN',
        status: TransactionStatusEnum.SUCCESS,
        paymentMethodName: 'TRANSFERBANK',
      };

      await service.findAll({ page: 1, size: 10 }, query as any);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('updateStatusTransactions', () => {
    it('should update transaction status with correct data', async () => {
      const mockTx = {
        purchaseTransaction: {
          update: jest.fn().mockResolvedValue({ id: 1 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (cb: any) =>
        cb(mockTx),
      );

      const dto = {
        code: 'PUR-001',
        status: TransactionStatusEnum.SUCCESS,
        metadata: { callback: 'data' },
        external_id: 'ext-callback-1',
      };

      await service.updateStatusTransactions(dto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTx.purchaseTransaction.update).toHaveBeenCalledWith({
        where: { code: 'PUR-001' },
        data: {
          status: TransactionStatusEnum.SUCCESS,
          metadata: { callback: 'data' },
          externalId: 'ext-callback-1',
        },
      });
    });
  });
});
