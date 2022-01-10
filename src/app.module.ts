import { Module, CacheModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { UserService } from './service/user.service';
import { ActivityService } from './service/activity.service';
import { MemorialsService } from './service/memorials.service';
import { CCSTokenService } from './service/ccsToken.service';
import { AppController } from './app.controller';
import { FlowService } from './service/flow.service';
import { BlockCursorService } from './service/blockCursor.service';
import { PrismaService } from './service/prisma.service';
import { ActivityTask } from './task/activity';
import { TaskUtils } from './task/utils';
import { CCSTokenTask } from './task/ccsToken';
import { BallotTask } from './task/ballot';
import { MemorialsTask } from './task/memorials';
import { RedisManager, RedisModule } from '@liaoliaots/nestjs-redis';
import { RedisLockModule } from '@huangang/nestjs-simple-redis-lock';
import { HttpModule } from '@nestjs/axios';
import { DiscordService } from './service/discord.service';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.load(path.resolve(__dirname, 'config', '**/!(*.d).{ts,js}'), {
      path: path.resolve(process.cwd(), !ENV ? '.env' : `.env.${ENV}`),
    }),
    CacheModule.register(),
    ScheduleModule.forRoot(),
    RedisModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        closeClient: true,
        config: config._redisServer(),
      }),
      inject: [ConfigService],
    }),
    RedisLockModule.registerAsync({
      useFactory: async (redisManager: RedisManager) => {
        return { prefix: ':lock:', client: redisManager.getClient() };
      },
      inject: [RedisManager],
    }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get('HTTP_TIMEOUT'),
        maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    UserService,
    ActivityService,
    MemorialsService,
    CCSTokenService,
    FlowService,
    BlockCursorService,
    PrismaService,
    TaskUtils,
    ActivityTask,
    BallotTask,
    CCSTokenTask,
    MemorialsTask,
    DiscordService,
  ],
  controllers: [AppController],
})
export class AppModule {}
