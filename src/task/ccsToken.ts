import { Inject, Injectable } from '@nestjs/common';
import { TaskUtils } from './utils';
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
    this.contractAddr = config.get(`${env}.ccsToken`);
    this.maxRangeQueryBlock = config.get(`${env}.maxRangeQueryBlock`);
    this.defaultRedisClient.del(':lock:ccsTokensAirdrop');
  }

  @RedisLock('ccsTokensAirdrop', 24 * 60 * 60 * 1000) // 1 day release lock
  async ccsTokensAirdrop() {
    await this.taskUtils.saveLastEventToDB(
      this.contractAddr,
      this.contractName,
      'TokenAirdrop',
      tokenAirdrop,
      this.maxRangeQueryBlock,
    );
  }
}
