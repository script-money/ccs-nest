import { ICreateOptionsFromEvent } from './activity';

export interface Event {
  blockId: Hash;
  blockHeight: number;
  blockTimestamp: ISOString;
  type: EventType;
  transactionId: Hash;
  transactionIndex: number;
  eventIndex: number;
  data: EventData;
}

export interface GetEventsOptions {
  contractAddr: string;
  contractName: string;
  eventName: string;
  endBlock: number;
}

export interface activityCreateEvent {
  data: ICreateOptionsFromEvent;
}

export interface flowInteractOptions {
  path: string;
  args: any[];
}

interface FclBase {
  f_type: string;
  f_vsn: '1.0.0';
}

export interface FlowTxData {
  status: number;
  statusCode: number;
  errorMessage: string;
  events: any[];
}

export interface compositeSignature extends FclBase {
  addr: AddressNoPrefix; // Flow Address (sans-prefix)
  keyId: number;
  signature: string; // Signature as a hex string
}

export interface Key {
  publicKey: string;
  privateKey: string;
  keyId: number;
  weight: number;
}

export type Address = string;
export type UFix64 = string; // flow's UFix64 in fcl is string
export type UInt64 = number;
export type UInt8 = number;
export type Int = number;
export type AddressNoPrefix = string;
export type EventData = Record<string, unknown>;
type Hash = string; // example: f531146afffb73a38859654c37e952f8a2d6991922b9e1c3857421fe51ff41ba
type ISOString = string; // example: 2021-09-18T10:25:20.872Z
type EventType = string; // example: 'A.01cf0e2f2f715450.ActivityContract.activityCreated';
