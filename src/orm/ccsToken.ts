import prisma from './clientForTest';
import {
  ITokenAirdropFromEvent,
  IGetTokenChangeRecordsOptions,
} from '../../src/interface/ccsToken';
import { Address } from '../interface/flow';

/**
 * create token airdrop record from event
 * @param eventData token airdrop event
 */
export const tokenAirdrop = async (eventData: ITokenAirdropFromEvent) => {
  await prisma.tokenChangeRecord.create({
    data: {
      type: 'Airdrop',
      amount: +eventData.amount,
      user: {
        connectOrCreate: {
          where: {
            address: eventData.receiver,
          },
          create: {
            address: eventData.receiver,
          },
        },
      },
      comment: `Recieve ${eventData.amount} $CCS airdrop`,
    },
  });
};

/**
 * get token change records
 * @param options query option
 * @returns TokenChangeRecord[]
 */
export const getTokenChangeRecords = async (
  options: IGetTokenChangeRecordsOptions,
) => {
  const { user, skip, take } = options;
  return await prisma.tokenChangeRecord.findMany({
    skip,
    take,
    where: {
      userAddress: user,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * check if already get faucet
 * @param addr address to check
 * @returns facuet record
 */
export const getHistory = async (addr: Address) => {
  return await prisma.faucet.findFirst({
    where: {
      address: addr,
    },
  });
};

/**
 * create new faucet record
 * @param addr address to add
 * @returns new record
 */
export const addFacuetRecord = async (addr: Address) => {
  return await prisma.faucet.create({
    data: {
      address: addr,
    },
  });
};
