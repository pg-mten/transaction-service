import { Test, TestingModule } from '@nestjs/testing';
import { WithdrawService } from './withdraw.service';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculateConfigClient } from 'src/microservice/config/fee-calculate.config.client';
import { BalanceService } from '../balance/balance.service';
import { InacashProviderClient } from 'src/microservice/provider/inacash/inacash.provider.client';
import { PdnProviderClient } from 'src/microservice/provider/pdn/pdn.provider.client';
import { UserAuthClient } from 'src/microservice/auth/user.auth.client';
import { ProfileProviderConfigClient } from 'src/microservice/config/profile-provider.config.client';
import { Decimal } from 'decimal.js';
import { TransactionStatusEnum } from '@prisma/client';
import { ResponseException } from 'src/shared/exception';

describe('WithdrawService', () => {
  let service: WithdrawService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    withdrawTransaction: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    withdrawFeeDetail: { createManyAndReturn: jest.fn() },
    merchantBalanceLog: { create: jest.fn() },
    internalBalanceLog: { create: jest.fn() },
    agentBalanceLog: { createMany: jest.fn() },
  };

  const mockFeeClient = { calculateWithdrawFeeConfigTCP: jest.fn() };
  const mockBalanceService = {
    checkBalanceMerchant: jest.fn(),
    checkBalanceAgents: jest.fn(),
    checkBalanceInternal: jest.fn(),
  };
  const mockInacash = { withdrawTCP: jest.fn() };
  const mockPdn = { withdrawTCP: jest.fn() };
  const mockUserAuth = { findProfileBankTCP: jest.fn() };
  const mockProfileProvider = { findProfileProviderTCP: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FeeCalculateConfigClient, useValue: mockFeeClient },
        { provide: BalanceService, useValue: mockBalanceService },
        { provide: InacashProviderClient, useValue: mockInacash },
        { provide: PdnProviderClient, useValue: mockPdn },
        { provide: UserAuthClient, useValue: mockUserAuth },
        { provide: ProfileProviderConfigClient, useValue: mockProfileProvider },
      ],
    }).compile();

    service = module.get<WithdrawService>(WithdrawService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── callProvider ────────────────────────────────────────────────

  describe('callProvider', () => {
    const baseDto = {
      code: 'WD-001',
      paymentMethodName: 'TRANSFERBANK',
      bankCode: 'BCA',
      bankName: 'BCA',
      accountNumber: '1234567890',
      nominal: new Decimal(50000),
    };

    it('should call PDN provider and return data', async () => {
      const providerResult = {
        code: 'WD-001',
        status: TransactionStatusEnum.SUCCESS,
        externalId: 'ext-pdn-1',
        metadata: { provider: 'pdn' },
        nominal: new Decimal(50000),
        feeProviderRealized: new Decimal(1000),
        netNominal: new Decimal(49000),
        accountNumber: '1234567890',
        accountHolderName: 'John Doe',
      };

      mockPdn.withdrawTCP.mockResolvedValue({ data: providerResult });

      const result = await (service as any).callProvider({
        ...baseDto,
        providerName: 'PDN',
      });

      expect(result).toEqual(providerResult);
      expect(mockPdn.withdrawTCP).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'WD-001', providerName: 'PDN' }),
      );
    });

    it('should call INACASH provider and return data', async () => {
      const providerResult = {
        code: 'WD-002',
        status: TransactionStatusEnum.PENDING,
        externalId: 'ext-ina-1',
        metadata: { provider: 'inacash' },
        nominal: new Decimal(50000),
        feeProviderRealized: new Decimal(2000),
        netNominal: new Decimal(48000),
        accountNumber: '1234567890',
        accountHolderName: 'Jane Doe',
      };

      mockInacash.withdrawTCP.mockResolvedValue({ data: providerResult });

      const result = await (service as any).callProvider({
        ...baseDto,
        providerName: 'INACASH',
      });

      expect(result).toEqual(providerResult);
      expect(mockInacash.withdrawTCP).toHaveBeenCalled();
    });

    it('should throw ResponseException for unknown provider', async () => {
      await expect(
        (service as any).callProvider({ ...baseDto, providerName: 'UNKNOWN' }),
      ).rejects.toThrow(ResponseException);
    });
  });

  // ─── create ──────────────────────────────────────────────────────

  describe('create', () => {
    const profileBankData = {
      userId: 1,
      profileId: 10,
      userRole: 'MERCHANT',
      accountNumber: '1234567890',
      bankCode: 'BCA',
      bankName: 'BCA',
      accountHolderName: 'John Doe',
    };

    const profileProviderData = {
      providerName: 'PDN',
      paymentMethodName: 'TRANSFERBANK',
    };

    const feeDto = {
      merchantFee: {
        id: 1,
        nominal: new Decimal(50000),
        netNominal: new Decimal(48000),
        feePercentage: new Decimal(4),
      },
      agentFee: {
        nominal: new Decimal(0),
        feeFixed: new Decimal(0),
        feePercentage: new Decimal(0),
        agents: [],
      },
      providerFee: {
        name: 'PDN',
        nominal: new Decimal(1000),
        feeFixed: new Decimal(1000),
        feePercentage: new Decimal(0),
      },
      internalFee: {
        nominal: new Decimal(1000),
        feeFixed: new Decimal(1000),
        feePercentage: new Decimal(0),
      },
    };

    it('should create a successful withdraw transaction (PDN)', async () => {
      const dto = { userId: 1, nominal: new Decimal(50000) };

      mockUserAuth.findProfileBankTCP.mockResolvedValue({
        data: profileBankData,
      });
      mockProfileProvider.findProfileProviderTCP.mockResolvedValue(
        profileProviderData,
      );

      mockPdn.withdrawTCP.mockResolvedValue({
        data: {
          code: 'mock-code',
          status: TransactionStatusEnum.SUCCESS,
          externalId: 'ext-1',
          metadata: {},
          nominal: new Decimal(50000),
          feeProviderRealized: new Decimal(1000),
          netNominal: new Decimal(49000),
          accountNumber: '1234567890',
          accountHolderName: 'John Doe',
        },
      });

      mockFeeClient.calculateWithdrawFeeConfigTCP.mockResolvedValue(feeDto);
      mockPrismaService.$transaction.mockImplementation(
        (cb: (trx: unknown) => unknown) => cb(mockPrismaService),
      );
      mockPrismaService.withdrawTransaction.create.mockResolvedValue({ id: 1 });
      mockPrismaService.withdrawFeeDetail.createManyAndReturn.mockResolvedValue(
        [],
      );

      mockBalanceService.checkBalanceMerchant.mockResolvedValue({
        balanceActive: new Decimal(500000),
        balancePending: new Decimal(0),
      });
      mockBalanceService.checkBalanceInternal.mockResolvedValue({
        balanceActive: new Decimal(1000000),
        balancePending: new Decimal(0),
      });
      mockBalanceService.checkBalanceAgents.mockResolvedValue([]);

      await service.create(dto);

      expect(mockUserAuth.findProfileBankTCP).toHaveBeenCalledWith({
        userId: 1,
      });
      expect(mockProfileProvider.findProfileProviderTCP).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          userRole: 'MERCHANT',
          transactionType: 'WITHDRAW',
        }),
      );
      expect(mockPdn.withdrawTCP).toHaveBeenCalled();
      expect(mockPrismaService.withdrawTransaction.create).toHaveBeenCalled();
    });

    it('should create a failed withdraw transaction when provider returns FAILED', async () => {
      const dto = { userId: 1, nominal: new Decimal(50000) };

      mockUserAuth.findProfileBankTCP.mockResolvedValue({
        data: profileBankData,
      });
      mockProfileProvider.findProfileProviderTCP.mockResolvedValue(
        profileProviderData,
      );

      const failedCode = `${Date.now()}-1-WITHDRAW-PDN-TRANSFERBANK-abc123`;
      mockPdn.withdrawTCP.mockResolvedValue({
        data: {
          code: failedCode,
          status: TransactionStatusEnum.FAILED,
          externalId: 'ext-failed-1',
          metadata: { error: 'insufficient funds' },
          nominal: new Decimal(50000),
          feeProviderRealized: new Decimal(0),
          netNominal: new Decimal(0),
          accountNumber: '1234567890',
          accountHolderName: 'John Doe',
        },
      });

      mockPrismaService.withdrawTransaction.create.mockResolvedValue({
        id: 99,
      });

      await service.create(dto);

      // When FAILED, it calls createFailed directly (no $transaction)
      expect(mockPrismaService.withdrawTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TransactionStatusEnum.FAILED,
            netNominal: new Decimal(0),
          }),
        }),
      );
    });
  });

  // ─── callback ────────────────────────────────────────────────────

  describe('callback', () => {
    it('should update status and create balance logs on SUCCESS callback', async () => {
      const callbackDto = {
        code: `${Date.now()}-1-WITHDRAW-PDN-TRANSFERBANK-abc123`,
        externalId: 'ext-1',
        status: TransactionStatusEnum.SUCCESS,
      };

      const updatedWithdraw = {
        id: 1,
        userId: 1,
        userRole: 'MERCHANT',
        providerName: 'PDN',
        paymentMethodName: 'TRANSFERBANK',
        nominal: new Decimal(50000),
        status: TransactionStatusEnum.SUCCESS,
      };

      const feeDto = {
        merchantFee: {
          id: 1,
          nominal: new Decimal(50000),
          netNominal: new Decimal(48000),
          feePercentage: new Decimal(4),
        },
        agentFee: {
          nominal: new Decimal(0),
          feeFixed: new Decimal(0),
          feePercentage: new Decimal(0),
          agents: [],
        },
        providerFee: {
          name: 'PDN',
          nominal: new Decimal(1000),
          feeFixed: new Decimal(1000),
          feePercentage: new Decimal(0),
        },
        internalFee: {
          nominal: new Decimal(1000),
          feeFixed: new Decimal(1000),
          feePercentage: new Decimal(0),
        },
      };

      const trx = {
        withdrawTransaction: {
          update: jest.fn().mockResolvedValue(updatedWithdraw),
        },
        withdrawFeeDetail: {
          createManyAndReturn: jest.fn().mockResolvedValue([]),
        },
      };
      mockPrismaService.$transaction.mockImplementation(
        (cb: (trx: unknown) => unknown) => cb(trx),
      );
      mockFeeClient.calculateWithdrawFeeConfigTCP.mockResolvedValue(feeDto);

      mockBalanceService.checkBalanceMerchant.mockResolvedValue({
        balanceActive: new Decimal(500000),
        balancePending: new Decimal(0),
      });
      mockBalanceService.checkBalanceInternal.mockResolvedValue({
        balanceActive: new Decimal(1000000),
        balancePending: new Decimal(0),
      });
      mockBalanceService.checkBalanceAgents.mockResolvedValue([]);

      await service.callback(callbackDto);

      expect(trx.withdrawTransaction.update).toHaveBeenCalled();
      expect(mockFeeClient.calculateWithdrawFeeConfigTCP).toHaveBeenCalled();
      expect(trx.withdrawFeeDetail.createManyAndReturn).toHaveBeenCalled();
    });

    it('should only update status on non-SUCCESS callback', async () => {
      const callbackDto = {
        code: `${Date.now()}-1-WITHDRAW-PDN-TRANSFERBANK-abc123`,
        externalId: 'ext-1',
        status: TransactionStatusEnum.PENDING,
      };

      const updatedWithdraw = {
        id: 1,
        userId: 1,
        providerName: 'PDN',
        paymentMethodName: 'TRANSFERBANK',
        nominal: new Decimal(50000),
        status: TransactionStatusEnum.PENDING,
      };

      const trx = {
        withdrawTransaction: {
          update: jest.fn().mockResolvedValue(updatedWithdraw),
        },
        withdrawFeeDetail: { createManyAndReturn: jest.fn() },
      };
      mockPrismaService.$transaction.mockImplementation(
        (cb: (trx: unknown) => unknown) => cb(trx),
      );

      await service.callback(callbackDto);

      expect(trx.withdrawTransaction.update).toHaveBeenCalled();
      // Fee details and balance log should NOT be created for non-SUCCESS
      expect(trx.withdrawFeeDetail.createManyAndReturn).not.toHaveBeenCalled();
      expect(
        mockFeeClient.calculateWithdrawFeeConfigTCP,
      ).not.toHaveBeenCalled();
    });
  });

  // ─── createBalanceLog ────────────────────────────────────────────

  describe('createBalanceLog', () => {
    it('should create merchant, internal, and agent balance logs', async () => {
      mockBalanceService.checkBalanceMerchant.mockResolvedValue({
        balanceActive: new Decimal(500000),
        balancePending: new Decimal(10000),
      });
      mockBalanceService.checkBalanceInternal.mockResolvedValue({
        balanceActive: new Decimal(1000000),
        balancePending: new Decimal(50000),
      });
      mockBalanceService.checkBalanceAgents.mockResolvedValue([
        {
          agentId: 1,
          balanceActive: new Decimal(20000),
          balancePending: new Decimal(0),
        },
        {
          agentId: 2,
          balanceActive: new Decimal(30000),
          balancePending: new Decimal(1000),
        },
      ]);

      mockPrismaService.merchantBalanceLog.create.mockResolvedValue({});
      mockPrismaService.internalBalanceLog.create.mockResolvedValue({});
      mockPrismaService.agentBalanceLog.createMany.mockResolvedValue({});

      const dto = {
        withdrawId: 1,
        merchantId: 10,
        providerName: 'PDN',
        paymentMethodName: 'TRANSFERBANK',
        nominal: new Decimal(50000),
        feeDto: {
          merchantFee: {
            id: 1,
            nominal: new Decimal(50000),
            netNominal: new Decimal(48000),
            feePercentage: new Decimal(4),
          },
          agentFee: {
            nominal: new Decimal(500),
            feeFixed: new Decimal(0),
            feePercentage: new Decimal(1),
            agents: [
              {
                id: 1,
                nominal: new Decimal(250),
                feePercentage: new Decimal(0.5),
              },
              {
                id: 2,
                nominal: new Decimal(250),
                feePercentage: new Decimal(0.5),
              },
            ],
          },
          providerFee: {
            name: 'PDN',
            nominal: new Decimal(1000),
            feeFixed: new Decimal(1000),
            feePercentage: new Decimal(0),
          },
          internalFee: {
            nominal: new Decimal(500),
            feeFixed: new Decimal(500),
            feePercentage: new Decimal(0),
          },
        },
      };

      await (service as any).createBalanceLog(dto);

      // Merchant balance log
      expect(mockPrismaService.merchantBalanceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionType: 'WITHDRAW',
          withdrawId: 1,
          merchantId: 10,
          changeAmount: new Decimal(50000),
          balanceActive: new Decimal(452000), // 500000 - 48000
          balancePending: new Decimal(10000),
        }),
      });

      // Internal balance log
      expect(mockPrismaService.internalBalanceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionType: 'WITHDRAW',
          withdrawId: 1,
          merchantId: 10,
          changeAmount: new Decimal(500),
          balanceActive: new Decimal(1000500), // 1000000 + 500
          balancePending: new Decimal(50000),
          providerName: 'PDN',
          paymentMethodName: 'TRANSFERBANK',
        }),
      });

      // Agent balance log (createMany with 2 agents)
      expect(mockPrismaService.agentBalanceLog.createMany).toHaveBeenCalledWith(
        {
          skipDuplicates: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              agentId: 1,
              changeAmount: new Decimal(250),
              balanceActive: new Decimal(20250), // 20000 + 250
              balancePending: new Decimal(0),
            }),
            expect.objectContaining({
              agentId: 2,
              changeAmount: new Decimal(250),
              balanceActive: new Decimal(30250), // 30000 + 250
              balancePending: new Decimal(1000),
            }),
          ]),
        },
      );
    });

    it('should throw error when merchant has insufficient balance', async () => {
      mockBalanceService.checkBalanceMerchant.mockResolvedValue({
        balanceActive: new Decimal(100), // Less than nominal (50000)
        balancePending: new Decimal(0),
      });
      mockBalanceService.checkBalanceInternal.mockResolvedValue({
        balanceActive: new Decimal(1000000),
        balancePending: new Decimal(0),
      });
      mockBalanceService.checkBalanceAgents.mockResolvedValue([]);

      const dto = {
        withdrawId: 1,
        merchantId: 10,
        providerName: 'PDN',
        paymentMethodName: 'TRANSFERBANK',
        nominal: new Decimal(50000),
        feeDto: {
          merchantFee: {
            id: 1,
            nominal: new Decimal(50000),
            netNominal: new Decimal(48000),
            feePercentage: new Decimal(4),
          },
          agentFee: {
            nominal: new Decimal(0),
            feeFixed: new Decimal(0),
            feePercentage: new Decimal(0),
            agents: [],
          },
          providerFee: {
            name: 'PDN',
            nominal: new Decimal(1000),
            feeFixed: new Decimal(1000),
            feePercentage: new Decimal(0),
          },
          internalFee: {
            nominal: new Decimal(1000),
            feeFixed: new Decimal(1000),
            feePercentage: new Decimal(0),
          },
        },
      };

      await expect((service as any).createBalanceLog(dto)).rejects.toThrow(
        'Balance Tidak Mencukupi',
      );
    });
  });

  // ─── feeDetailMapper ─────────────────────────────────────────────

  describe('feeDetailMapper', () => {
    it('should map all fee types without agents (3 entries)', () => {
      const feeDto = {
        merchantFee: {
          id: 1,
          nominal: new Decimal(50000),
          netNominal: new Decimal(48000),
          feePercentage: new Decimal(4),
        },
        agentFee: {
          nominal: new Decimal(0),
          feeFixed: new Decimal(0),
          feePercentage: new Decimal(0),
          agents: [],
        },
        providerFee: {
          name: 'PDN',
          nominal: new Decimal(1000),
          feeFixed: new Decimal(1000),
          feePercentage: new Decimal(0),
        },
        internalFee: {
          nominal: new Decimal(1000),
          feeFixed: new Decimal(1000),
          feePercentage: new Decimal(0),
        },
      };

      const result = (service as any).feeDetailMapper({
        withdrawId: 1,
        feeDto,
      });

      expect(result).toHaveLength(3);

      expect(result[0]).toEqual({
        withdrawId: 1,
        type: 'MERCHANT',
        feePercentage: new Decimal(4),
        feeFixed: new Decimal(0),
        nominal: new Decimal(48000),
      });

      expect(result[1]).toEqual({
        withdrawId: 1,
        type: 'PROVIDER',
        feeFixed: new Decimal(1000),
        feePercentage: new Decimal(0),
        nominal: new Decimal(1000),
      });

      expect(result[2]).toEqual({
        withdrawId: 1,
        type: 'INTERNAL',
        feeFixed: new Decimal(1000),
        feePercentage: new Decimal(0),
        nominal: new Decimal(1000),
      });
    });

    it('should include agent entries when agents are present', () => {
      const feeDto = {
        merchantFee: {
          id: 1,
          nominal: new Decimal(50000),
          netNominal: new Decimal(48000),
          feePercentage: new Decimal(4),
        },
        agentFee: {
          nominal: new Decimal(500),
          feeFixed: new Decimal(0),
          feePercentage: new Decimal(1),
          agents: [
            {
              id: 1,
              nominal: new Decimal(250),
              feePercentage: new Decimal(0.5),
            },
            {
              id: 2,
              nominal: new Decimal(250),
              feePercentage: new Decimal(0.5),
            },
          ],
        },
        providerFee: {
          name: 'PDN',
          nominal: new Decimal(1000),
          feeFixed: new Decimal(1000),
          feePercentage: new Decimal(0),
        },
        internalFee: {
          nominal: new Decimal(500),
          feeFixed: new Decimal(500),
          feePercentage: new Decimal(0),
        },
      };

      const result = (service as any).feeDetailMapper({
        withdrawId: 5,
        feeDto,
      });

      expect(result).toHaveLength(5); // 3 base + 2 agents

      const agentEntries = result.filter((r: any) => r.type === 'AGENT');
      expect(agentEntries).toHaveLength(2);
      expect(agentEntries[0]).toEqual({
        withdrawId: 5,
        type: 'AGENT',
        agentId: 1,
        feeFixed: new Decimal(500), // agentFee.nominal
        feePercentage: new Decimal(0.5),
        nominal: new Decimal(250),
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
          name: 'PDN',
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
        () => void (service as any).feeDetailMapper({ withdrawId: 1, feeDto }),
      ).toThrow(ResponseException);
    });

    it('should throw ResponseException when internalFee is null', () => {
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
        providerFee: {
          name: 'PDN',
          nominal: new Decimal(0),
          feeFixed: new Decimal(0),
          feePercentage: new Decimal(0),
        },
        internalFee: null,
      };

      expect(
        () => void (service as any).feeDetailMapper({ withdrawId: 1, feeDto }),
      ).toThrow(ResponseException);
    });
  });

  // ─── findOneThrow ────────────────────────────────────────────────

  describe('findOneThrow', () => {
    it('should return the withdraw transaction when found', async () => {
      const mockTransaction = {
        id: 1,
        code: 'WD-001',
        externalId: 'ext-1',
        referenceId: 'ref-1',
        userId: 1,
        userRole: 'MERCHANT',
        providerName: 'PDN',
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

      mockPrismaService.withdrawTransaction.findUniqueOrThrow.mockResolvedValue(
        mockTransaction,
      );

      const result = await service.findOneThrow(1);

      expect(result).toEqual(mockTransaction);
      expect(
        mockPrismaService.withdrawTransaction.findUniqueOrThrow,
      ).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { feeDetails: true },
      });
    });

    it('should throw when withdraw transaction not found', async () => {
      mockPrismaService.withdrawTransaction.findUniqueOrThrow.mockRejectedValue(
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
      mockPrismaService.$transaction.mockResolvedValue([0, []]);

      const result = await service.findAll({ page: 1, size: 10 }, {} as any);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalCount).toBe(0);
    });

    it('should return 3 items with fully-filled fields and verify DTO mapping', async () => {
      const mockItems = [
        {
          id: 1,
          code: 'WD-001',
          externalId: 'ext-1',
          referenceId: 'ref-1',
          userId: 1,
          userRole: 'MERCHANT',
          providerName: 'PDN',
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
          code: 'WD-002',
          externalId: 'ext-2',
          referenceId: 'ref-2',
          userId: 2,
          userRole: 'AGENT',
          providerName: 'INACASH',
          paymentMethodName: 'EWALLET',
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
          code: 'WD-003',
          externalId: 'ext-3',
          referenceId: 'ref-3',
          userId: 3,
          userRole: 'MERCHANT',
          providerName: 'PDN',
          paymentMethodName: 'TRANSFERBANK',
          nominal: new Decimal(200000),
          netNominal: new Decimal(195000),
          status: TransactionStatusEnum.SUCCESS,
          metadata: { data: 'ok' },
          createdAt: new Date('2025-01-17T10:00:00Z'),
          feeDetails: [],
        },
      ];

      mockPrismaService.$transaction.mockResolvedValue([3, mockItems]);

      const result = await service.findAll({ page: 1, size: 10 }, {} as any);

      expect(result.data).toHaveLength(3);
      expect(result.pagination.totalCount).toBe(3);

      const first = result.data[0];
      expect(first.id).toBe(1);
      expect(first.userId).toBe(1);
      expect(first.userRole).toBe('MERCHANT');
      expect(first.providerName).toBe('PDN');
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
          code: 'WD-N01',
          externalId: null,
          referenceId: null,
          userId: 1,
          userRole: 'MERCHANT',
          providerName: 'PDN',
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

      mockPrismaService.$transaction.mockResolvedValue([1, mockItems]);

      const result = await service.findAll({ page: 1, size: 10 }, {} as any);

      const item = result.data[0];
      expect(item.externalId).toBeNull();
      expect(item.referenceId).toBeNull();
      expect(item.metadata).toBeNull();
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
});
