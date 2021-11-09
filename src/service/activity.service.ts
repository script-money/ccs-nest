import { Injectable, HttpStatus, Inject } from '@nestjs/common';
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
  modifyMetadata,
} from '../orm/activity';
import * as fcl from '@onflow/fcl';
import { FlowService } from './flow.service';

@Injectable()
export class ActivityService {
  constructor(@Inject(FlowService) private readonly flowService: FlowService) {}

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
    const isValid = await fcl.verifyUserSignature(message, compositeSignatures);
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
      console.log('No activities to close...');
      return;
    }
    for await (const activityID of activityIDs) {
      try {
        const txArgList = await closeActivity({
          id: activityID.id,
        });
        for (const txArg of txArgList) {
          console.log('txArg', txArg);
          const result = await this.flowService.sendTxByAdmin(txArg);
          if (result !== undefined) await fcl.tx(result).onceSealed();
        }
      } catch (error) {
        console.error(`close activiy ${activityID.id} error:`, error);
        continue;
      }
    }
  }
}
