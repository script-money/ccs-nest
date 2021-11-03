import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { FlowService } from './flow.service';
import {
  IGetMemorialsOptions,
  IGetMemorialsResponse,
} from '../interface/momerials';
import { getMemorialsByActivity, getMemorialsByUser } from '../orm/momerials';

@Injectable()
export class MemorialsService {
  constructor(@Inject(FlowService) private readonly flowService: FlowService) {}

  async queryMany(
    option: IGetMemorialsOptions,
  ): Promise<IGetMemorialsResponse> {
    if (option.userAddress !== undefined && option.activityId === undefined) {
      try {
        const memorialsArray = await getMemorialsByUser(option.userAddress);
        return {
          success: true,
          data: memorialsArray,
        };
      } catch (error) {
        console.warn(error);
        return {
          success: false,
          data: [],
          errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage: 'unknow error when get memorials by address',
          showType: 2,
        };
      }
    } else if (
      option.userAddress === undefined &&
      option.activityId !== undefined
    ) {
      try {
        const memorialsArray = await getMemorialsByActivity(option.activityId);
        return {
          success: true,
          data: memorialsArray,
        };
      } catch (error) {
        console.warn(error);
        return {
          success: false,
          data: [],
          errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage: 'unknow error when get memorials by activityID',
          showType: 2,
        };
      }
    } else {
      return {
        success: true,
        data: [],
        errorCode: HttpStatus.NOT_ACCEPTABLE,
        errorMessage: 'userAddress and activityId can not coexist',
        showType: 1,
      };
    }
  }
}
