import prisma from './clientForTest';
import {
  IDepositFromEvent,
  IMemorialMintedFromEvent,
  IWithdrawFromEvent,
} from '../../src/interface/momerials';
import { Address, UInt64 } from '../../src/interface/flow';

/**
 *
 * @param eventData eventdata from memorial minted
 * @returns memorial created
 */
export const createMemorial = async (eventData: IMemorialMintedFromEvent) => {
  const newMemorial = await prisma.memorial.create({
    data: {
      version: eventData.version,
      owner: {
        connect: {
          address: eventData.reciever,
        },
      },
      id: eventData.memorialId,
      seriesNumber: eventData.seriesNumber,
      circulatingCount: eventData.circulatingCount,
      activity: {
        connect: {
          id: eventData.activityID,
        },
      },
      isPositive: eventData.isPositive,
      bonus: parseFloat(eventData.bonus),
    },
  });

  await prisma.user.update({
    data: {
      votingPower: {
        increment: newMemorial.bonus,
      },
    },
    where: {
      address: eventData.reciever,
    },
  });
  return newMemorial;
};

/**
 * front display information to select
 */
export const memorialSelector = {
  id: true,
  ownerAddress: true,
  activity: {
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      categories: {
        select: {
          category: {
            select: {
              type: true,
            },
          },
        },
      },
    },
  },
  seriesNumber: true,
  circulatingCount: true,
  mintedAt: true,
  isPositive: true,
  bonus: true,
};

/**
 * get single memorial by id
 * @param memorialId memorial id
 * @returns memorial
 */
export const getMemorial = async (memorialId: number) => {
  return await prisma.memorial.findUnique({
    where: {
      id: memorialId,
    },
    select: memorialSelector,
  });
};

/**
 * get memorials owner by user
 * @param userAddress user address
 * @returns memorial list
 */
export const getMemorialsByUser = async (userAddress: Address) => {
  return await prisma.memorial.findMany({
    where: {
      ownerAddress: userAddress,
    },
    select: memorialSelector,
  });
};

/**
 * get memorials owner by activityID
 * @param activityId activity
 * @returns memorial list
 */
export const getMemorialsByActivity = async (activityId: UInt64) => {
  return await prisma.memorial.findMany({
    where: {
      activityId,
    },
    select: memorialSelector,
  });
};

/**
 * update bonus when withdraw memorial
 * @param eventData withDraw memorials event
 */
export const withDrawMemorials = async (eventData: IWithdrawFromEvent) => {
  const memorial = await prisma.memorial.findUnique({
    where: {
      id: eventData.id,
    },
  });

  await prisma.user.update({
    data: {
      votingPower: {
        decrement: memorial.bonus,
      },
    },
    where: {
      address: eventData.from,
    },
  });
};

/**
 * update bonus when deposit memorial
 * @param eventData withDraw memorials event
 */
export const depositMemorials = async (eventData: IDepositFromEvent) => {
  const tmpMemorial = await prisma.memorial.findUnique({
    where: {
      id: eventData.id,
    },
  });
  if (tmpMemorial === null || tmpMemorial.ownerAddress === eventData.to) return;
  const memorial = await prisma.memorial.update({
    data: {
      ownerAddress: eventData.to,
    },
    where: {
      id: eventData.id,
    },
  });
  await prisma.user.update({
    data: {
      votingPower: {
        increment: memorial.bonus,
      },
    },
    where: {
      address: eventData.to,
    },
  });
};
