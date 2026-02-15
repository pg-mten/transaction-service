import { Test, TestingModule } from '@nestjs/testing';
import { BalanceService } from './balance.service';
import { PRISMA_SERVICE } from '../prisma/prisma.provider';
import { Decimal } from 'decimal.js';
import { TransactionTypeEnum } from '@prisma/client';

describe('BalanceService', () => {
  let service: BalanceService;

  const mockPrisma = {
    merchantBalanceLog: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    agentBalanceLog: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    internalBalanceLog: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        { provide: PRISMA_SERVICE, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Merchant Balance ────────────────────────────────────────────

  describe('checkBalanceMerchant', () => {
    it('should return merchant balance when data exists', async () => {
      mockPrisma.merchantBalanceLog.findFirst.mockResolvedValue({
        merchantId: 1,
        balanceActive: new Decimal(150000),
        balancePending: new Decimal(25000),
      });

      const result = await service.checkBalanceMerchant(1);

      expect(result.merchantId).toBe(1);
      expect(result.balanceActive).toEqual(new Decimal(150000));
      expect(result.balancePending).toEqual(new Decimal(25000));
      expect(mockPrisma.merchantBalanceLog.findFirst).toHaveBeenCalledWith({
        where: { merchantId: 1 },
        orderBy: { createdAt: 'desc' },
        select: { merchantId: true, balanceActive: true, balancePending: true },
      });
    });

    it('should return default zero balances when no data exists (null)', async () => {
      mockPrisma.merchantBalanceLog.findFirst.mockResolvedValue(null);

      const result = await service.checkBalanceMerchant(99);

      expect(result.merchantId).toBe(99);
      expect(result.balanceActive).toEqual(new Decimal(0));
      expect(result.balancePending).toEqual(new Decimal(0));
    });

    it('should handle 3 different merchant balance lookups', async () => {
      const mockOutputs = [
        {
          merchantId: 1,
          balanceActive: new Decimal(100000),
          balancePending: new Decimal(5000),
        },
        {
          merchantId: 2,
          balanceActive: new Decimal(250000),
          balancePending: new Decimal(0),
        },
        {
          merchantId: 3,
          balanceActive: new Decimal(0),
          balancePending: new Decimal(75000),
        },
      ];

      for (const mock of mockOutputs) {
        mockPrisma.merchantBalanceLog.findFirst.mockResolvedValue(mock);
        const result = await service.checkBalanceMerchant(mock.merchantId);
        expect(result.merchantId).toBe(mock.merchantId);
        expect(result.balanceActive).toEqual(mock.balanceActive);
        expect(result.balancePending).toEqual(mock.balancePending);
      }
    });
  });

  describe('aggregateBalanceMerchant', () => {
    it('should return zero balances when no merchants exist', async () => {
      mockPrisma.merchantBalanceLog.findMany.mockResolvedValue([]);

      const result = await service.aggregateBalanceMerchant();

      expect(result.balanceActive).toEqual(new Decimal(0));
      expect(result.balancePending).toEqual(new Decimal(0));
    });

    it('should return correct totals for 1 merchant', async () => {
      mockPrisma.merchantBalanceLog.findMany.mockResolvedValue([
        {
          balanceActive: new Decimal(100000),
          balancePending: new Decimal(5000),
        },
      ]);

      const result = await service.aggregateBalanceMerchant();

      expect(result.balanceActive).toEqual(new Decimal(100000));
      expect(result.balancePending).toEqual(new Decimal(5000));
    });

    it('should sum balances across 3 merchants', async () => {
      mockPrisma.merchantBalanceLog.findMany.mockResolvedValue([
        {
          balanceActive: new Decimal(100000),
          balancePending: new Decimal(5000),
        },
        {
          balanceActive: new Decimal(250000),
          balancePending: new Decimal(10000),
        },
        { balanceActive: new Decimal(50000), balancePending: new Decimal(0) },
      ]);

      const result = await service.aggregateBalanceMerchant();

      expect(result.balanceActive).toEqual(new Decimal(400000));
      expect(result.balancePending).toEqual(new Decimal(15000));
      expect(mockPrisma.merchantBalanceLog.findMany).toHaveBeenCalledWith({
        distinct: ['merchantId'],
        where: {
          transactionType: {
            in: [
              TransactionTypeEnum.WITHDRAW,
              TransactionTypeEnum.TOPUP,
              TransactionTypeEnum.DISBURSEMENT,
              TransactionTypeEnum.SETTLEMENT_PURCHASE,
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { balanceActive: true, balancePending: true },
      });
    });
  });

  // ─── Agent Balance ───────────────────────────────────────────────

  describe('checkBalanceAgent', () => {
    it('should return agent balance when data exists', async () => {
      mockPrisma.agentBalanceLog.findFirst.mockResolvedValue({
        agentId: 5,
        balanceActive: new Decimal(75000),
        balancePending: new Decimal(12000),
      });

      const result = await service.checkBalanceAgent(5);

      expect(result.agentId).toBe(5);
      expect(result.balanceActive).toEqual(new Decimal(75000));
      expect(result.balancePending).toEqual(new Decimal(12000));
      expect(mockPrisma.agentBalanceLog.findFirst).toHaveBeenCalledWith({
        where: { agentId: 5 },
        orderBy: { createdAt: 'desc' },
        select: { agentId: true, balanceActive: true, balancePending: true },
      });
    });

    it('should return default zero balances when no data exists (null)', async () => {
      mockPrisma.agentBalanceLog.findFirst.mockResolvedValue(null);

      const result = await service.checkBalanceAgent(99);

      expect(result.agentId).toBe(99);
      expect(result.balanceActive).toEqual(new Decimal(0));
      expect(result.balancePending).toEqual(new Decimal(0));
    });
  });

  describe('checkBalanceAgents', () => {
    it('should return empty array when no agents found', async () => {
      mockPrisma.agentBalanceLog.findMany.mockResolvedValue([]);

      const result = await service.checkBalanceAgents([]);

      expect(result).toEqual([]);
    });

    it('should return balance for 1 agent', async () => {
      mockPrisma.agentBalanceLog.findMany.mockResolvedValue([
        {
          agentId: 1,
          balanceActive: new Decimal(50000),
          balancePending: new Decimal(0),
        },
      ]);

      const result = await service.checkBalanceAgents([1]);

      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe(1);
      expect(result[0].balanceActive).toEqual(new Decimal(50000));
      expect(result[0].balancePending).toEqual(new Decimal(0));
    });

    it('should return balances for 3 agents', async () => {
      mockPrisma.agentBalanceLog.findMany.mockResolvedValue([
        {
          agentId: 1,
          balanceActive: new Decimal(50000),
          balancePending: new Decimal(1000),
        },
        {
          agentId: 2,
          balanceActive: new Decimal(80000),
          balancePending: new Decimal(0),
        },
        {
          agentId: 3,
          balanceActive: new Decimal(120000),
          balancePending: new Decimal(5000),
        },
      ]);

      const result = await service.checkBalanceAgents([1, 2, 3]);

      expect(result).toHaveLength(3);
      expect(result[0].agentId).toBe(1);
      expect(result[0].balanceActive).toEqual(new Decimal(50000));
      expect(result[1].agentId).toBe(2);
      expect(result[1].balanceActive).toEqual(new Decimal(80000));
      expect(result[2].agentId).toBe(3);
      expect(result[2].balancePending).toEqual(new Decimal(5000));
      expect(mockPrisma.agentBalanceLog.findMany).toHaveBeenCalledWith({
        where: { agentId: { in: [1, 2, 3] } },
        distinct: ['agentId'],
        orderBy: { createdAt: 'desc' },
        select: { agentId: true, balanceActive: true, balancePending: true },
      });
    });
  });

  describe('checkBalanceAllAgent', () => {
    it('should return empty array when no agents exist', async () => {
      mockPrisma.agentBalanceLog.findMany.mockResolvedValue([]);

      const result = await service.checkBalanceAllAgent();

      expect(result).toEqual([]);
    });

    it('should return balance for 1 agent', async () => {
      mockPrisma.agentBalanceLog.findMany.mockResolvedValue([
        {
          agentId: 10,
          balanceActive: new Decimal(30000),
          balancePending: new Decimal(2000),
        },
      ]);

      const result = await service.checkBalanceAllAgent();

      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe(10);
      expect(result[0].balanceActive).toEqual(new Decimal(30000));
    });

    it('should return balances for 3 agents', async () => {
      mockPrisma.agentBalanceLog.findMany.mockResolvedValue([
        {
          agentId: 10,
          balanceActive: new Decimal(30000),
          balancePending: new Decimal(2000),
        },
        {
          agentId: 20,
          balanceActive: new Decimal(60000),
          balancePending: new Decimal(0),
        },
        {
          agentId: 30,
          balanceActive: new Decimal(90000),
          balancePending: new Decimal(500),
        },
      ]);

      const result = await service.checkBalanceAllAgent();

      expect(result).toHaveLength(3);
      expect(result[0].agentId).toBe(10);
      expect(result[1].agentId).toBe(20);
      expect(result[2].agentId).toBe(30);
      expect(result[2].balancePending).toEqual(new Decimal(500));
      expect(mockPrisma.agentBalanceLog.findMany).toHaveBeenCalledWith({
        distinct: ['agentId'],
        orderBy: { createdAt: 'desc' },
        select: { agentId: true, balanceActive: true, balancePending: true },
      });
    });
  });

  describe('aggregateBalanceAgent', () => {
    it('should return zero balances when no agents exist', async () => {
      mockPrisma.agentBalanceLog.findMany.mockResolvedValue([]);

      const result = await service.aggregateBalanceAgent();

      expect(result.balanceActive).toEqual(new Decimal(0));
      expect(result.balancePending).toEqual(new Decimal(0));
    });

    it('should return correct totals for 1 agent', async () => {
      mockPrisma.agentBalanceLog.findMany.mockResolvedValue([
        {
          balanceActive: new Decimal(50000),
          balancePending: new Decimal(3000),
        },
      ]);

      const result = await service.aggregateBalanceAgent();

      expect(result.balanceActive).toEqual(new Decimal(50000));
      expect(result.balancePending).toEqual(new Decimal(3000));
    });

    it('should sum balances across 3 agents', async () => {
      mockPrisma.agentBalanceLog.findMany.mockResolvedValue([
        {
          balanceActive: new Decimal(50000),
          balancePending: new Decimal(3000),
        },
        { balanceActive: new Decimal(80000), balancePending: new Decimal(0) },
        {
          balanceActive: new Decimal(20000),
          balancePending: new Decimal(7000),
        },
      ]);

      const result = await service.aggregateBalanceAgent();

      expect(result.balanceActive).toEqual(new Decimal(150000));
      expect(result.balancePending).toEqual(new Decimal(10000));
      expect(mockPrisma.agentBalanceLog.findMany).toHaveBeenCalledWith({
        distinct: ['agentId'],
        where: {
          transactionType: {
            in: [
              TransactionTypeEnum.WITHDRAW,
              TransactionTypeEnum.TOPUP,
              TransactionTypeEnum.DISBURSEMENT,
              TransactionTypeEnum.SETTLEMENT_PURCHASE,
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { balanceActive: true, balancePending: true },
      });
    });
  });

  // ─── Internal Balance ────────────────────────────────────────────

  describe('checkBalanceInternal', () => {
    it('should return internal balance when data exists', async () => {
      mockPrisma.internalBalanceLog.findFirst.mockResolvedValue({
        balanceActive: new Decimal(500000),
        balancePending: new Decimal(30000),
      });

      const result = await service.checkBalanceInternal();

      expect(result.balanceActive).toEqual(new Decimal(500000));
      expect(result.balancePending).toEqual(new Decimal(30000));
      expect(mockPrisma.internalBalanceLog.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        select: { balanceActive: true, balancePending: true },
      });
    });

    it('should return default zero balances when no data exists (null)', async () => {
      mockPrisma.internalBalanceLog.findFirst.mockResolvedValue(null);

      const result = await service.checkBalanceInternal();

      expect(result.balanceActive).toEqual(new Decimal(0));
      expect(result.balancePending).toEqual(new Decimal(0));
    });
  });

  describe('aggregateBalanceInternal', () => {
    it('should return balance without providerName filter', async () => {
      mockPrisma.internalBalanceLog.findFirst.mockResolvedValue({
        balanceActive: new Decimal(1000000),
        balancePending: new Decimal(50000),
      });

      const result = await service.aggregateBalanceInternal();

      expect(result.balanceActive).toEqual(new Decimal(1000000));
      expect(result.balancePending).toEqual(new Decimal(50000));
      expect(mockPrisma.internalBalanceLog.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            providerName: expect.anything(),
          }),
        }),
      );
    });

    it('should return balance with providerName filter', async () => {
      mockPrisma.internalBalanceLog.findFirst.mockResolvedValue({
        balanceActive: new Decimal(300000),
        balancePending: new Decimal(10000),
      });

      const result = await service.aggregateBalanceInternal('PDN');

      expect(result.balanceActive).toEqual(new Decimal(300000));
      expect(result.balancePending).toEqual(new Decimal(10000));
      expect(mockPrisma.internalBalanceLog.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ providerName: 'PDN' }),
        }),
      );
    });

    it('should return default zero balances when no data exists (null)', async () => {
      mockPrisma.internalBalanceLog.findFirst.mockResolvedValue(null);

      const result = await service.aggregateBalanceInternal(null);

      expect(result.balanceActive).toEqual(new Decimal(0));
      expect(result.balancePending).toEqual(new Decimal(0));
    });
  });
});
