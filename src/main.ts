import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: ['debug', 'error', 'verbose', 'warn', 'log'],
    },
  );
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(7001, '0.0.0.0');
}
bootstrap();
