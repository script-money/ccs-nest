import { User } from '@prisma/client';
import { Address } from './flow';
import { IResponse } from './utils';

export interface IGetUserResponse extends IResponse {
  data: User | null;
}

export interface IUserService {
  queryOne(address: string): Promise<IGetUserResponse>;
}

export interface IAddUserFromEvent {
  address: Address;
}

export interface IUpdateUserFromDiscord {
  address: string;
  id: string;
  username: string;
  avatar: string;
  discriminator: string; // such as 0001
}
