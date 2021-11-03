import prisma from './clientForTest';
import { IBallotsBoughtFromEvent } from '../../src/interface/ballot';

/**
 * create record when buy ballots
 * @param eventData buy ballot data from event
 */
export const createBallotBought = async (
  eventData: IBallotsBoughtFromEvent,
) => {
  const { amount, buyer, price } = eventData;
  const priceNum = parseFloat(price);
  await prisma.tokenChangeRecord.create({
    data: {
      type: 'BuyBallot',
      amount: -amount * priceNum,
      user: {
        connectOrCreate: {
          where: {
            address: buyer,
          },
          create: {
            address: buyer,
          },
        },
      },
      comment: `Buy ${amount} ballots at ${priceNum * amount} $CCS`,
    },
  });

  return await prisma.ballotBuyRecord.create({
    data: {
      amount,
      buyerAddress: eventData.buyer,
      price: priceNum,
    },
  });
};
