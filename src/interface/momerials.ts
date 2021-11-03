import { getMemorialsByUser } from '../orm/momerials';
import { Prisma } from '@prisma/client';
import { Address, UFix64, UInt64, UInt8 } from './flow';
import { IResponse } from './utils';

export interface IDepositFromEvent {
  id: UInt64;
  to?: Address;
}

export interface IWithdrawFromEvent {
  id: UInt64;
  from?: Address;
}

export interface IMemorialMintedFromEvent {
  version: UInt8;
  reciever: Address;
  memorialId: UInt64;
  seriesNumber: UInt64;
  circulatingCount: UInt64;
  activityID: UInt64;
  isPositive: boolean;
  bonus: UFix64;
}

export interface IGetMemorialsOptions {
  activityId?: number;
  userAddress?: Address;
}

type MemorialsGetType = Prisma.PromiseReturnType<typeof getMemorialsByUser>;

export interface IGetMemorialsResponse extends IResponse {
  data: MemorialsGetType | null;
}
