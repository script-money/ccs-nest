import { HttpStatus, Injectable } from '@nestjs/common';
import { IResponse } from 'src/interface/utils';
import { toggleMaintenance, getMaintenanceStatus } from 'src/orm/manage';

@Injectable()
export class ManageService {
  async getMaintenanceStatus(): Promise<IResponse> {
    try {
      const result = await getMaintenanceStatus();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.warn(error);
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorMessage: 'unknow error when getMaintenanceStatus',
        showType: 2,
      };
    }
  }

  async toggleMaintenance(isInMaintenance: string): Promise<IResponse> {
    try {
      const result = toggleMaintenance(
        isInMaintenance === 'true' ? true : false,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.warn(error);
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorMessage: 'unknow error when toggleMaintenance',
        showType: 2,
      };
    }
  }
}
