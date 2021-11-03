import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MID_INTERVAL, TaskUtils } from './utils';
import { ConfigService } from 'nestjs-config';
import {
  createMemorial,
  depositMemorials,
  withDrawMemorials,
} from 'src/orm/momerials';

@Injectable()
export class MemorialsTask {
  private contractAddr: string;
  private contractName: string;
  private midRangeQueryBlock: number;
  constructor(
    private readonly config: ConfigService,
    @Inject(TaskUtils) private readonly taskUtils: TaskUtils,
  ) {
    const env = config._env();
    this.contractName = 'Memorials';
    this.contractAddr = config.get(`${env}.memorials`);
    this.midRangeQueryBlock = config.get(`${env}.midRangeQueryBlock`);
  }

  @Cron(MID_INTERVAL)
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
