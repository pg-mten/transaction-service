import { Injectable } from '@nestjs/common';
import { TransactionTypeEnum } from '@prisma/client';
import { MerchantSignatureAuthClient } from 'src/microservice/merchant-signature/merchant-signature.auth.client';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class Disbursement1Api {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantSignatureClient: MerchantSignatureAuthClient,
  ) {}

  private readonly transactionType = TransactionTypeEnum.DISBURSEMENT;
}
