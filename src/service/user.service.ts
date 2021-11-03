import { Injectable, HttpStatus } from '@nestjs/common';
import { IGetUserResponse } from '../interface/user';
import { getUser } from '../orm/user';

@Injectable()
export class UserService {
  async queryOne(address: string): Promise<IGetUserResponse> {
    try {
      const result = await getUser(address);
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
        errorMessage: 'unknow error when get single user',
        showType: 2,
      };
    }
  }
}
