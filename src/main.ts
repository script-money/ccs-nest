import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'verbose', 'warn', 'log'],
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(7001);
}
bootstrap();
