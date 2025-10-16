import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './modules/app/app.module';
import { WinstonModule } from 'nest-winston';
import 'winston-daily-rotate-file';
import {
  API_PREFIX,
  APP_NAME,
  IS_DEVELOPMENT,
  PORT,
  VERSION,
} from './shared/constant/global.constant';
import { logger } from './shared/constant/logger.constant';
import { useContainer } from 'class-validator';
import { MyLogger } from './modules/logger/logger.service';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SERVICES } from './microservice/client.constant';
import { MetricsMiddleware } from './middlewares/metrics.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  });
  app.use(new MetricsMiddleware().use);

  app.setGlobalPrefix(API_PREFIX, {
    exclude: ['/metrics'],
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true }); // class-validator ngikut DI Nest

  // TODO jangan sampai production, origin set true demi development dan testing
  app.enableCors({
    origin: true,
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
    // allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // if (IS_DEVELOPMENT) {
    const options = new DocumentBuilder()
      .setTitle(`${APP_NAME} Service`)
      .setDescription(`${APP_NAME} Service API Description`)
      .setVersion(VERSION)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(API_PREFIX, app, document);
  // }
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: SERVICES.TRANSACTION.host,
      port: SERVICES.TRANSACTION.port,
    },
  });

  await app.startAllMicroservices();
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.listen(PORT, async () => {
    const myLogger = await app.resolve(MyLogger);
    myLogger.log(`${APP_NAME} started listening: ${PORT}`);
    console.log(`${APP_NAME} started listening: ${PORT}`);
  });
}
bootstrap();
