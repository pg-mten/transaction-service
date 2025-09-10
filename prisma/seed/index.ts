import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/modules/app/app.module';
import { INestApplicationContext } from '@nestjs/common';
import { purchaseSeed } from './purchase.seed';
import { topupSeed } from './topup.seed';
import { withdrawSeed } from './withdraw.seed';
import { disbursementSeed } from './disbursement.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeder selesai 🚀');
  const app: INestApplicationContext =
    await NestFactory.createApplicationContext(AppModule);

  try {
    // await purchaseSeed(app);
    await topupSeed(app);
    // await withdrawSeed(app);
    // await disbursementSeed(app);
    console.log('Proccess Done');
  } catch (error) {
    console.log('Error');
    console.log(error);
  } finally {
    console.log('App Close');
    await app.close();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
