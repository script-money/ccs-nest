import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SHORT_INTERVAL, TaskUtils } from './utils';
import { ConfigService } from 'nestjs-config';
import { addUser } from 'src/orm/user';
import { createBallotBought } from 'src/orm/ballot';

@Injectable()
export class BallotTask {
  private contractAddr: string;
  private contractName: string;
  private shortQueryBlock: number;
  constructor(
    private readonly config: ConfigService,
    @Inject(TaskUtils) private readonly taskUtils: TaskUtils,
  ) {
    const env = config._env();
    this.contractAddr = config.get(`${env}.ballotContract`);
    this.contractName = 'BallotContract';
    this.shortQueryBlock = config.get(`${env}.shortQueryBlock`);
  }

  @Cron(SHORT_INTERVAL)
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
