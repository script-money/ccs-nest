import { Injectable, HttpStatus } from '@nestjs/common';
import { IGetUserResponse, IUpdateUserFromDiscord } from '../interface/user';
import { getUser, updateUser } from '../orm/user';

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

  async updateByDiscord(
    updateUserInfo: IUpdateUserFromDiscord,
  ): Promise<IGetUserResponse> {
    try {
      const result = await updateUser(updateUserInfo);
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
