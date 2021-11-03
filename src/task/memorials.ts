import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MID_INTERVAL, TaskUtils } from './utils';
import { ConfigService } from 'nestjs-config';
import {
  createMemorial,
  depositMemorials,
  withDrawMemorials,
} from 'src/orm/momerials';
import {
  RedisLock,
  RedisLockService,
} from '@huangang/nestjs-simple-redis-lock';
import { Redis } from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

@Injectable()
export class MemorialsTask {
  private contractAddr: string;
  private contractName: string;
  private midRangeQueryBlock: number;
  constructor(
    protected readonly config: ConfigService,
    protected readonly lockService: RedisLockService,
    @InjectRedis() private readonly defaultRedisClient: Redis,
    @Inject(TaskUtils) private readonly taskUtils: TaskUtils,
  ) {
    const env = config._env();
    this.contractName = 'Memorials';
    this.contractAddr = config.get(`${env}.memorials`);
    this.midRangeQueryBlock = config.get(`${env}.midRangeQueryBlock`);
    this.defaultRedisClient.del(':lock:memorialsUpdate');
  }

  @Cron(MID_INTERVAL)
  @RedisLock('memorialsUpdate', 24 * 60 * 60 * 1000) // 1 day release lock
  async memorialsUpdate() {
    const lastBlock = await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'memorialMinted',
      createMemorial,
      this.midRangeQueryBlock,
    );

    await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'Withdraw',
      withDrawMemorials,
      this.midRangeQueryBlock,
      lastBlock,
    );

    await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'Deposit',
      depositMemorials,
      this.midRangeQueryBlock,
      lastBlock,
    );
  }
}
