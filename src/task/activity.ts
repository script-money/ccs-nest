import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MID_INTERVAL, SHORT_INTERVAL, TaskUtils } from './utils';
import { ConfigService } from 'nestjs-config';
import {
  closeActivity,
  consumptionUpdated,
  createActivity,
  createVote,
  rewardParameterUpdated,
} from 'src/orm/activity';
import { ActivityService } from '../service/activity.service';
import {
  RedisLockService,
  RedisLock,
} from '@huangang/nestjs-simple-redis-lock';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class ActivityTask {
  private contractAddr: string;
  private contractName: string;
  private shortQueryBlock: number;
  private maxRangeQueryBlock: number;
  private closeActivityIntervalMinutes: number;

  constructor(
    protected readonly config: ConfigService,
    protected readonly lockService: RedisLockService,
    @InjectRedis() private readonly defaultRedisClient: Redis,
    @Inject(forwardRef(() => ActivityService))
    private readonly activityService: ActivityService,
    @Inject(TaskUtils) private readonly taskUtils: TaskUtils,
  ) {
    const env = config._env();
    this.contractName = 'ActivityContract';
    this.contractAddr = config.get(`${env}.activityContract`);
    this.shortQueryBlock = config.get(`${env}.shortQueryBlock`);
    this.maxRangeQueryBlock = config.get(`${env}.maxRangeQueryBlock`);
    this.closeActivityIntervalMinutes = config.get(
      `${env}.closeActivityIntervalMinutes`,
    );
    this.defaultRedisClient.del(':lock:activitiesUpdate');
    this.defaultRedisClient.del(':lock:parameterUpdate');
    this.defaultRedisClient.del(':lock:closeActivity');
  }

  @Cron(SHORT_INTERVAL)
  @RedisLock('activitiesUpdate', 24 * 60 * 60 * 1000) // 1 day release lock
  async activitiesUpdate() {
    const lastBlock = await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'activityCreated',
      createActivity,
      this.shortQueryBlock,
    );

    await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'activityVoted',
      createVote,
      this.shortQueryBlock,
      lastBlock,
    );

    await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'activityClosed',
      closeActivity,
      this.shortQueryBlock,
      lastBlock,
    );
  }

  @RedisLock('parameterUpdate', 24 * 60 * 60 * 1000) // 1 day release lock
  async parameterUpdate() {
    await this.taskUtils.saveLastEventToDB(
      this.contractAddr,
      this.contractName,
      'consumptionUpdated',
      consumptionUpdated,
      this.maxRangeQueryBlock,
    );

    await this.taskUtils.saveLastEventToDB(
      this.contractAddr,
      this.contractName,
      'rewardParameterUpdated',
      rewardParameterUpdated,
      this.maxRangeQueryBlock,
    );
  }

  @Cron(MID_INTERVAL)
  @RedisLock('closeActivity', 24 * 60 * 60 * 1000) // 1 day release lock
  async closeActivity() {
    await this.activityService.close(this.closeActivityIntervalMinutes);
  }
}
