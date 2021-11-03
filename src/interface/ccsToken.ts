import { Faucet } from '@prisma/client';
import { Address, UFix64 } from './flow';
import { IResponse } from './utils';

export interface ITokenAirdropFromEvent {
  receiver: Address;
  amount: UFix64;
}

export interface IGetTokenChangeRecordsOptions {
  user?: Address;
  skip?: number;
  take?: number;
}

export interface IRequestFreeTokenResponse extends IResponse {
  data: Faucet;
}

export interface ICCSTokenService {
  requestFree(addr: Address): Promise<IRequestFreeTokenResponse>;
}
