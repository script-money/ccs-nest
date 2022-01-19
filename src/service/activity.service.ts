import {
  Injectable,
  HttpStatus,
  Inject,
  CACHE_MANAGER,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { ActivitiesGetDTO } from '../dto/activity';
import {
  IGetActivitiesResponse,
  IGetActivityResponse,
  IModifyMetadataOptions,
  IModifyOptions,
} from '../interface/activity';
import {
  closeActivity,
  getActivities,
  getActivitiesToClose,
  getActivity,
  getRecommendedActivities,
  markActivityConsumed,
  modifyMetadata,
} from '../orm/activity';
import * as fcl from '@onflow/fcl';
import { FlowService } from './flow.service';
import { ActivityTask } from 'src/task/activity';
import { IResponse } from 'src/interface/utils';
import { Cache } from 'cache-manager';
import { DiscordService } from './discord.service';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @Inject(FlowService) private readonly flowService: FlowService,
    @Inject(forwardRef(() => ActivityTask))
    private readonly activityTask: ActivityTask,
    @Inject(DiscordService)
    private readonly discordService: DiscordService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async queryMany(options: ActivitiesGetDTO): Promise<IGetActivitiesResponse> {
    try {
      const [activities, total] = await getActivities(options);

      return {
        success: true,
        data: activities,
        total,
      };
    } catch (error) {
      console.warn(error);
      return {
        success: false,
        data: [],
        total: 0,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorMessage: 'unknow error when get activities',
        showType: 2,
      };
    }
  }

  async queryOne(id: number): Promise<IGetActivityResponse> {
    try {
      const result = await getActivity(Number(id));
      if (result === null) {
        return {
          success: false,
          data: null,
          errorCode: HttpStatus.NOT_FOUND,
          errorMessage: `No activity found by id ${id}`,
          showType: 1,
        };
      }
      if (!result.closed) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { voteResult, ...otherInfo } = result;
        return {
          success: true,
          data: otherInfo,
        };
      } else {
        return {
          success: true,
          data: result,
        };
      }
    } catch (error) {
      console.warn(error);
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorMessage: 'unknow error when get single activity',
        showType: 2,
      };
    }
  }

  async updateOne(options: IModifyOptions): Promise<IGetActivityResponse> {
    const { id, message, compositeSignatures } = options;
    const MSG = Buffer.from(message).toString('hex');
    const isValid = await fcl.verifyUserSignatures(MSG, compositeSignatures);
    if (!isValid) {
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.UNAUTHORIZED,
        errorMessage: 'Signature Invalid',
        showType: 1,
      };
    }

    const result = await getActivity(Number(id));
    if (result.creator.address !== compositeSignatures[0].addr) {
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.UNAUTHORIZED,
        errorMessage: `You are not the creator of activity ${id}`,
        showType: 1,
      };
    }

    const modifyData = JSON.parse(message) as IModifyMetadataOptions;
    try {
      const result2 = await modifyMetadata(id, modifyData);
      return {
        success: true,
        data: result2,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.BAD_REQUEST,
        errorMessage: `update activity ${id} content fail`,
        showType: 1,
      };
    }
  }

  async close(intervalMinutes: number): Promise<IGetActivityResponse> {
    const activityIDs = await getActivitiesToClose(intervalMinutes);
    if (activityIDs === null) {
      this.logger.log('No activities to close...');
      return;
    }
    for await (const activityID of activityIDs) {
      try {
        const txArgList = await closeActivity({
          id: activityID.id,
        });
        for (const txArg of txArgList) {
          this.logger.log('txArg', txArg);
          const result = await this.flowService.sendTxByAdmin(txArg);
          if (result !== undefined) await fcl.tx(result).onceSealed();
        }
      } catch (error) {
        console.error(`close activiy ${activityID.id} error:`, error);
        continue;
      }
    }
  }

  async parameterUpdate(privateKey: string): Promise<IResponse> {
    if (
      !this.flowService.minterKeys.some((key) => key.privateKey === privateKey)
    ) {
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.NOT_ACCEPTABLE,
        errorMessage: `You should use admin key to update parameter`,
        showType: 1,
      };
    }

    try {
      await this.activityTask.parameterUpdate();
      return {
        success: true,
        data: 'Parameter update success or not modify',
      };
    } catch (error) {
      this.logger.error('parameterUpdate services', error);
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.NOT_MODIFIED,
        errorMessage: `You can't update parameter`,
        showType: 1,
      };
    }
  }

  async pushToDiscord(privateKey?: string): Promise<IResponse> {
    if (
      !this.flowService.minterKeys.some((key) => key.privateKey === privateKey)
    ) {
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.NOT_ACCEPTABLE,
        errorMessage: `You should use admin key to push activity to discord`,
        showType: 1,
      };
    }
    try {
      const activities = await getRecommendedActivities(0.6);
      if (activities.length === 0) {
        this.logger.log('No activity push to discord');
        return {
          success: false,
          data: null,
          errorCode: HttpStatus.NOT_MODIFIED,
          errorMessage: `No activity push to discord`,
          showType: 1,
        };
      }
      let count = 0;
      for (const activity of activities) {
        if (!activity.consumed) {
          count++;
          await this.discordService.sendActivity(activity);
          await markActivityConsumed(activity.id);
        }
      }
      return {
        success: true,
        data: `push ${count} activities to discord success`,
      };
    } catch (error) {
      this.logger.error('push activity to discord', error);
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorMessage: 'unknow error when push activity to discord',
        showType: 2,
      };
    }
  }
}
