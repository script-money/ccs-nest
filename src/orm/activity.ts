import prisma from './clientForTest';
import { ActivityType, Vote, Prisma } from '@prisma/client';
import {
  ICloseOptionsFromTask,
  IConsumptionUpdatedFromEvent,
  ICreateOptionsFromEvent,
  IModifyMetadataOptions,
  IQueryManyOptions,
  IRewardParameterUpdatedFromEvent,
  IVotedOptionsFromEvent,
} from '../interface/activity';
import moment from 'moment';
import * as t from '@onflow/types';
import * as fcl from '@onflow/fcl';
import { flowInteractOptions } from '../interface/flow';
import { toUFix64 } from '../orm/clientForTest';

/**
 * add activity record to db
 * @param eventData activity event data from blockchain
 * @returns
 */
export const createActivity = async (eventData: ICreateOptionsFromEvent) => {
  const { content, startDate, endDate, source, categories } = JSON.parse(
    eventData.metadata,
  );

  const factor = await prisma.economicFactor.findFirst({
    orderBy: { id: 'desc' },
  });

  let creatorPartly;
  // get creater power
  try {
    creatorPartly = await prisma.user.upsert({
      where: { address: eventData.creator },
      update: {},
      create: { address: eventData.creator },
      select: {
        votingPower: true,
      },
    });
  } catch (error) {
    console.warn('createActivity:', error);
  }

  const newActivity = await prisma.activity.create({
    data: {
      id: eventData.id,
      title: eventData.title,
      metadata: JSON.parse(eventData.metadata),
      creator: {
        connect: {
          address: eventData.creator,
        },
      },
      closed: false,
      content,
      startDate,
      upVote: 1,
      downVote: 0,
      endDate,
      source,
      categories: {
        create: categories.map((activityType: ActivityType) => {
          return { category: { connect: { type: activityType } } };
        }),
      },
      voteResult: {
        create: [
          {
            voterAddr: eventData.creator,
            power: creatorPartly.votingPower,
          },
        ],
      },
    },
  });

  await prisma.tokenChangeRecord.create({
    data: {
      type: 'CreateActivity',
      amount: -factor.createConsumption,
      user: {
        connect: {
          address: eventData.creator,
        },
      },
      comment: `Created activity [${eventData.title}] at ${newActivity.createdAt}`,
    },
  });

  return newActivity;
};

/**
 * get activity info
 * @param id activityID
 * @returns activity
 */
export const getActivity = async (id: number) => {
  const activityToQuery = await prisma.activity.findUnique({
    where: {
      id: id,
    },
    include: {
      voteResult: true,
      creator: true,
    },
  });

  return activityToQuery;
};

/**
 * get activity list
 * @param param0 { limit?, offset?, type?, canVote?, address?, canJoin?, createBy}
 */
export const getActivities = async ({
  limit: limitSource,
  offset: offsetSource,
  type,
  canVote: canVoteSource,
  address: addressSource,
  canJoin: canJoinSource,
  createBy,
}: IQueryManyOptions) => {
  const limit = limitSource === undefined ? 10 : Number(limitSource);
  const offset = offsetSource === undefined ? 0 : Number(offsetSource);
  const canVote =
    canVoteSource === undefined ? false : String(canVoteSource) === 'true';
  const address =
    addressSource === undefined ? '0x0000000000000000' : addressSource;
  const canJoin =
    canJoinSource === undefined ? false : String(canJoinSource) === 'true';

  const otherConditions = {
    AND: [
      {
        categories: {
          some: {
            category: {
              type,
            },
          },
        },
      },
      {
        creator: {
          address: createBy,
        },
      },
    ],
  };

  let addVoteCondition;

  if (canVote) {
    addVoteCondition = {
      ...otherConditions,
      NOT: {
        voteResult: {
          some: {
            voterAddr: {
              equals: address, // user voted list should not return
            },
          },
        },
      },
      AND: {
        closed: false,
      },
    };
  } else {
    addVoteCondition = otherConditions;
  }

  let addJoinCondition;

  if (canJoin) {
    addJoinCondition = {
      ...addVoteCondition,
      OR: [
        {
          endDate: {
            gt: new Date(),
          },
        },
        {
          endDate: {
            equals: null,
          },
        },
      ],
    };
  } else {
    addJoinCondition = addVoteCondition;
  }

  return await prisma.$transaction([
    prisma.activity.findMany({
      skip: offset,
      take: limit,
      where: addJoinCondition,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        creator: true,
      },
    }),
    prisma.activity.count({ where: addJoinCondition }),
  ]);
};

/**
 * get activity to close
 * @returns activity[] | null
 */
export const getActivitiesToClose = async (intervalMinutes: number) => {
  const activityIds = await prisma.activity.findMany({
    where: {
      closed: false,
      createdAt: {
        lt: moment().subtract(intervalMinutes, 'minutes').toDate(),
      },
    },
    select: {
      id: true,
    },
  });
  return activityIds;
};

export const modifyMetadata = async (
  id: number,
  newMetadata: IModifyMetadataOptions,
) => {
  const oldActivity = await prisma.activity.findUnique({
    where: {
      id,
    },
    select: {
      metadata: true,
      content: true,
      startDate: true,
      endDate: true,
      source: true,
    },
  });

  if (oldActivity?.metadata && typeof oldActivity?.metadata === 'object') {
    const oldMetadata = oldActivity?.metadata as Prisma.JsonObject;
    const combineData = Object.assign({}, oldMetadata, newMetadata);

    let endDate = undefined;
    if (combineData.endDate !== undefined && combineData.endDate !== null) {
      if (typeof combineData.endDate === 'string') {
        endDate = combineData.endDate;
      } else {
        endDate = combineData.endDate.format();
      }
    } else if (combineData.endDate === null) {
      endDate = null;
    }

    const updatedActivity = await prisma.activity.update({
      where: { id: id },
      data: {
        metadata: combineData,
        content: combineData.content,
        startDate:
          typeof combineData.startDate === 'string'
            ? combineData.startDate
            : combineData.startDate.format(),
        endDate,
        source: combineData.source,
      },
    });
    return updatedActivity;
  }
};

/**
 * add vote record to db
 * @param eventData vote events data from blockchain
 * @returns newVote
 */
export const createVote = async (eventData: IVotedOptionsFromEvent) => {
  const voter = await prisma.user.upsert({
    where: { address: eventData.voter },
    update: {},
    create: {
      address: eventData.voter,
    },
  });

  const result = await prisma.vote.findUnique({
    where: {
      voterAddr_activityId: {
        voterAddr: eventData.voter,
        activityId: eventData.id,
      },
    },
  });

  if (result !== null) {
    return;
  }

  const newVote = await prisma.vote.create({
    data: {
      voter: {
        connect: {
          address: voter.address,
        },
      },
      isUpVote: eventData.isUpVote,
      power: voter.votingPower,
      activity: {
        connect: {
          id: eventData.id,
        },
      },
    },
  });

  if (eventData.isUpVote) {
    await prisma.activity.update({
      where: {
        id: eventData.id,
      },
      data: {
        upVote: {
          increment: 1,
        },
      },
    });
  } else {
    await prisma.activity.update({
      where: {
        id: eventData.id,
      },
      data: {
        downVote: {
          increment: 1,
        },
      },
    });
  }
  return newVote;
};

/**
 * update activity's consumption
 * @param evendata data from chain event
 */
export const consumptionUpdated = async (
  evendata: IConsumptionUpdatedFromEvent,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, ...factorProps } =
    await prisma.economicFactor.findFirst({
      orderBy: { id: 'asc' },
    });

  await prisma.economicFactor.create({
    data: {
      ...factorProps,
      createConsumption: parseFloat(evendata.newPrice),
    },
  });
};

/**
 * update activity's reward parameters
 * @param evendata data from chain event
 */
export const rewardParameterUpdated = async (
  evendata: IRewardParameterUpdatedFromEvent,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, ...factorProps } =
    await prisma.economicFactor.findFirst({
      orderBy: { id: 'desc' },
    });

  await prisma.economicFactor.create({
    data: {
      ...factorProps,
      maxRatio: parseFloat(evendata.newParams.maxRatio),
      minRatio: parseFloat(evendata.newParams.minRatio),
      averageRatio: parseFloat(evendata.newParams.averageRatio),
      asymmetry: parseFloat(evendata.newParams.asymmetry),
    },
  });
};

/**
 * get newest economic factor
 * @returns economicFactor
 */
export const getLastEconomicFactor = async () => {
  return await prisma.economicFactor.findFirst({
    orderBy: { id: 'desc' },
  });
};

/**
 * get economic factors
 * @returns economicFactor[]
 */
export const getEconomicFactors = async () => {
  return await prisma.economicFactor.findMany({});
};

/**
 * close acivity from chain event
 * @param options activity id
 * @returns paramters with send transactions
 */
export const closeActivity = async (options: ICloseOptionsFromTask) => {
  // 1. find voter's votingPower by activity id, compute activity is positive or negative
  const activity = await prisma.activity.findUnique({
    where: { id: options.id },
    select: {
      id: true,
      voteResult: true,
      creator: true,
      title: true,
      closed: true,
    },
  });

  if (activity.closed) return;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...factor } = await prisma.economicFactor.findFirst({
    orderBy: { id: 'desc' },
  });

  const positiveTotalVotingPower = Math.abs(
    activity.voteResult
      .filter((vote: Vote) => vote.isUpVote)
      .reduce((a, b: Vote) => +a + +b.power, 0),
  );
  // console.log('positiveTotalVotingPower', positiveTotalVotingPower);

  const negativeTotalVotingPower = Math.abs(
    activity.voteResult
      .filter((vote: Vote) => !vote.isUpVote)
      .reduce((a, b: Vote) => +a + +b.power, 0),
  );
  // console.log('negativeTotalVotingPower', negativeTotalVotingPower);

  // 2. compute votingRatio by the party with the larger absolute value and recent average voting power
  const absVotingPower = Math.max(
    positiveTotalVotingPower,
    negativeTotalVotingPower,
  );

  // console.log('absVotingPower', absVotingPower);

  const recentActivities = await prisma.activity.findMany({
    take: factor.recentN,
    orderBy: {
      id: 'desc',
    },
    select: {
      absTotalPower: true,
      rewardToken: true,
      upVote: true,
      downVote: true,
    },
  });

  const newRecentAvgTotalPower =
    recentActivities.reduce((acc, value) => acc + value.absTotalPower, 0) /
    recentActivities.length;

  const votingRatio =
    factor.recentAvgTotalPower === 0
      ? 1
      : absVotingPower / newRecentAvgTotalPower;
  // console.log('votingRatio', votingRatio);

  // 3. according votingRatio, rewardParams in db and asymmetric curve algorithm, get tokenRatio
  const rewardRatio = asymmetrySigmoid(
    votingRatio,
    factor.maxRatio,
    factor.minRatio,
    factor.averageRatio,
    factor.asymmetry,
  );

  // 4. update activity in db
  let rewardToken: number;
  if (positiveTotalVotingPower <= negativeTotalVotingPower) {
    rewardToken = 0;
  } else {
    rewardToken = rewardRatio * factor.createConsumption;
  }
  // console.log('rewardToken', rewardToken);

  const bonus = factor.bounsRatio * votingRatio;

  await prisma.activity.update({
    where: {
      id: activity.id,
    },
    data: {
      rewardToken,
      closed: true,
      lockDate: moment().toISOString(),
      absTotalPower: absVotingPower,
      bouns: bonus,
    },
  });

  // 5. create new economicFactor's with new ballotPrice and recentAvgTotalPower
  const recentTotalRewards = recentActivities.reduce(
    (acc, value) => acc + value.rewardToken,
    0,
  );
  // console.log('recentTotalRewards', recentTotalRewards);

  const recentTotalComsuption =
    recentActivities.length * factor.createConsumption;

  // console.log('recentTotalComsuption', recentTotalComsuption);

  const recentTotalVoteAmount = recentActivities.reduce(
    (acc, value) => acc + value.downVote + value.upVote,
    0,
  );

  let newBallotPrice: number;
  if (recentTotalRewards > recentTotalComsuption) {
    newBallotPrice =
      (recentTotalRewards - recentTotalComsuption) /
      (recentTotalVoteAmount * factor.ballotPrice);
  } else {
    newBallotPrice = factor.ballotMinPrice;
  }

  // console.log('newBallotPrice', newBallotPrice);

  const mintPositive = positiveTotalVotingPower > negativeTotalVotingPower;

  // console.log('mintPositive', mintPositive);

  if (
    newBallotPrice !== factor.ballotPrice ||
    newRecentAvgTotalPower !== factor.recentAvgTotalPower
  )
    await prisma.economicFactor.create({
      data: {
        ...factor,
        ballotPrice: newBallotPrice,
        recentAvgTotalPower: newRecentAvgTotalPower,
      },
    });

  if (rewardToken > 0) {
    await prisma.tokenChangeRecord.create({
      data: {
        type: 'RewardByActivity',
        amount: rewardToken,
        user: {
          connect: {
            address: activity.creator.address,
          },
        },
        comment: `Reward by craete activity [${activity.title}]`,
      },
    });
  }

  // 6. return services parameters use by send transactions to blockchain
  return [
    {
      path: 'CCSToken/mint_tokens_and_distribute.cdc',
      args: [
        fcl.arg(
          [{ key: activity.creator.address, value: toUFix64(rewardToken) }],
          t.Dictionary({ key: t.Address, value: t.UFix64 }),
        ),
      ],
    },
    {
      path: 'Ballot/set_price.cdc',
      args: [fcl.arg(toUFix64(newBallotPrice), t.UFix64)],
    },
    {
      path: 'Activity/close_activity.cdc',
      args: [
        fcl.arg(options.id, t.UInt64),
        fcl.arg(toUFix64(bonus), t.UFix64),
        fcl.arg(mintPositive, t.Bool),
      ],
    },
  ] as flowInteractOptions[];
};

/**
 * asymmetric curve algorithm
 * @param votingRatio function's x value
 * @param top f(x) < top
 * @param bottom f(x) > bottom
 * @param k f(x=votingRatio) = k
 * @param s The higher the value of s, the steeper the curve and the more incentive
 * @returns f(x)
 */
const asymmetrySigmoid = (
  votingRatio: number,
  top: number,
  bottom: number,
  k: number,
  s: number,
) => {
  const r = (top - bottom) / (k - bottom);
  const denominator = Math.pow(
    1 + Math.pow(10, 1 + Math.log10(Math.pow(r, 1 / s) - 1) - votingRatio),
    s,
  );
  const y = bottom + (top - bottom) / denominator;
  return y;
};

export const getRecommendedActivities = async (k: number) => {
  const activities = await prisma.activity.findMany({
    where: {
      closed: false,
    },
    select: {
      id: true,
      title: true,
      content: true,
      source: true,
      startDate: true,
      endDate: true,
      categories: true,
      voteResult: true,
    },
  });

  const factors = await prisma.economicFactor.findMany({
    take: -1,
  });

  const recommendedActivities = activities.filter((activity) => {
    const positiveTotalVotingPower = Math.abs(
      activity.voteResult
        .filter((vote: Vote) => vote.isUpVote)
        .reduce((a, b: Vote) => +a + +b.power, 0),
    );
    const negativeTotalVotingPower = Math.abs(
      activity.voteResult
        .filter((vote: Vote) => !vote.isUpVote)
        .reduce((a, b: Vote) => +a + +b.power, 0),
    );
    return (
      positiveTotalVotingPower + negativeTotalVotingPower >=
      factors[0].recentAvgTotalPower * k
    );
  });

  return recommendedActivities;
};
