import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SHORT_INTERVAL, TaskUtils } from './utils';
import { ConfigService } from 'nestjs-config';
import { addUser } from 'src/orm/user';
import { createBallotBought } from 'src/orm/ballot';
import {
  RedisLock,
  RedisLockService,
} from '@huangang/nestjs-simple-redis-lock';
import { Redis } from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

@Injectable()
export class BallotTask {
  private contractAddr: string;
  private contractName: string;
  private shortQueryBlock: number;
  constructor(
    protected readonly config: ConfigService,
    protected readonly lockService: RedisLockService,
    @InjectRedis() private readonly defaultRedisClient: Redis,
    @Inject(TaskUtils) private readonly taskUtils: TaskUtils,
  ) {
    const env = config._env();
    this.contractAddr = config.get(`${env}.ballotContract`);
    this.contractName = 'BallotContract';
    this.shortQueryBlock = config.get(`${env}.shortQueryBlock`);
    this.defaultRedisClient.del(':lock:ballotsUpdate');
  }

  @Cron(SHORT_INTERVAL)
  @RedisLock('ballotsUpdate', 24 * 60 * 60 * 1000) // 1 day release lock
  async ballotsUpdate() {
    const lastBlock = await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'ballotPrepared',
      addUser,
      this.shortQueryBlock,
    );

    await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'ballotsBought',
      createBallotBought,
      this.shortQueryBlock,
      lastBlock,
    );
  }
}
