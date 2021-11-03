import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LONG_INTERVAL, TaskUtils } from './utils';
import { ConfigService } from 'nestjs-config';

import { tokenAirdrop } from 'src/orm/ccsToken';
import {
  RedisLock,
  RedisLockService,
} from '@huangang/nestjs-simple-redis-lock';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class CCSTokenTask {
  private contractAddr: string;
  private contractName: string;
  private maxRangeQueryBlock: number;
  constructor(
    protected readonly config: ConfigService,
    protected readonly lockService: RedisLockService,
    @InjectRedis() private readonly defaultRedisClient: Redis,
    @Inject(TaskUtils) private readonly taskUtils: TaskUtils,
  ) {
    const env = config._env();
    this.contractName = 'CCSToken';
    this.contractAddr = config.get(`${env}.ccsTokenContract`);
    this.maxRangeQueryBlock = config.get(`${env}.maxRangeQueryBlock`);
    this.defaultRedisClient.del(':lock:ccsTokensAirdrop');
  }

  @Cron(LONG_INTERVAL) // every day
  @RedisLock('ccsTokensAirdrop', 24 * 60 * 60 * 1000) // 1 day release lock
  async ccsTokensAirdrop() {
    await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'TokenAirdrop',
      tokenAirdrop,
      this.maxRangeQueryBlock,
    );
  }
}
