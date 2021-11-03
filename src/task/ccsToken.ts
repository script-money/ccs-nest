import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LONG_INTERVAL, TaskUtils } from './utils';
import { ConfigService } from 'nestjs-config';

import { tokenAirdrop } from 'src/orm/ccsToken';

@Injectable()
export class CCSTokenTask {
  private contractAddr: string;
  private contractName: string;
  private maxRangeQueryBlock: number;
  constructor(
    private readonly config: ConfigService,
    @Inject(TaskUtils) private readonly taskUtils: TaskUtils,
  ) {
    const env = config._env();
    this.contractName = 'CCSToken';
    this.contractAddr = config.get(`${env}.ccsTokenContract`);
    this.maxRangeQueryBlock = config.get(`${env}.maxRangeQueryBlock`);
  }

  @Cron(LONG_INTERVAL) // every day
  async CCSTokensAirdrop() {
    await this.taskUtils.saveEventsToDB(
      this.contractAddr,
      this.contractName,
      'TokenAirdrop',
      tokenAirdrop,
      this.maxRangeQueryBlock,
    );
  }
}
