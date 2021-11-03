import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  LONG_INTERVAL,
  MID_INTERVAL,
  SHORT_INTERVAL,
  TaskUtils,
} from './utils';
import { ConfigService } from 'nestjs-config';
import {
  closeActivity,
  consumptionUpdated,
  createActivity,
  createVote,
  rewardParameterUpdated,
} from 'src/orm/activity';
import { ActivityService } from '../service/activity.service';

@Injectable()
export class ActivityTask {
  private contractAddr: string;
  private contractName: string;
  private shortQueryBlock: number;
  private maxRangeQueryBlock: number;
  private closeActivityIntervalMinutes: number;

  constructor(
    private readonly config: ConfigService,
    @Inject(ActivityService) private readonly activityService: ActivityService,
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
  }

  @Cron(SHORT_INTERVAL)
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

  @Cron(LONG_INTERVAL)
  async parameterUpdate() {
    const lastBlock = await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'consumptionUpdated',
      consumptionUpdated,
      this.maxRangeQueryBlock,
    );

    await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'rewardParameterUpdated',
      rewardParameterUpdated,
      this.maxRangeQueryBlock,
      lastBlock,
    );
  }

  @Cron(MID_INTERVAL)
  async closeActivity() {
    await this.activityService.close(this.closeActivityIntervalMinutes);
  }
}
