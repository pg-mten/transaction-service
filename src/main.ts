import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './modules/app/app.module';
import { MyLogger } from './modules/logger/logger.service';
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
  });

  app.setGlobalPrefix(API_PREFIX);

  app.useGlobalPipes(new ValidationPipe());
  useContainer(app.select(AppModule), { fallbackOnErrors: true }); // class-validator ngikut DI Nest

  if (IS_DEVELOPMENT) {
    const options = new DocumentBuilder()
      .setTitle(`${APP_NAME} Service`)
      .setDescription(`${APP_NAME} Service API Description`)
      .setVersion(VERSION)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(API_PREFIX, app, document);
  }

  await app.listen(PORT, async () => {
    const myLogger = await app.resolve(MyLogger);
    myLogger.log(`${APP_NAME} started listening: ${PORT}`);
    console.log(`${APP_NAME} started listening: ${PORT}`);
  });
}
bootstrap();
