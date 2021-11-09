import {
  closeActivity,
  consumptionUpdated,
  createActivity,
  createVote,
  getActivities,
  getActivity,
  getLastEconomicFactor,
  modifyMetadata,
  rewardParameterUpdated,
} from '../../src/orm/activity';
import {
  USER1,
  USER2,
  USER3,
  USER4,
  toUFix64,
} from '../../src/orm/clientForTest';
import moment from 'moment';
import {
  IConsumptionUpdatedFromEvent,
  ICreateOptionsFromEvent,
  IVotedOptionsFromEvent,
  IRewardParameterUpdatedFromEvent,
  userValidActivityTypeEnum,
} from '../../src/interface/activity';
import { createMemorial } from '../../src/orm/momerials';
import * as faker from 'faker';

test('can create new activity (negative) ', async () => {
  const metadata = JSON.stringify({
    content: '参加订阅，第一时间获取信息',
    startDate: moment('2021-09-22 09+08:00'),
    endDate: null,
    source: null,
    categories: ['Register', 'Whitelist'],
  });

  const activity = {
    id: 0,
    title: 'ICPSquad的邮件订阅',
    metadata,
    creator: USER1,
  } as ICreateOptionsFromEvent;

  const result = await createActivity(activity);

  expect(result.id).toEqual(0);
  expect(result.createdAt).not.toBeNull();
  expect(result.updatedAt).not.toBeNull();
  expect(result.startDate).not.toBeNull();
  expect(result.endDate).toBeNull();
  expect(result.source).toBeNull();
  expect(result.closed).toBe(false);
});

test('user2 can vote up', async () => {
  const vote = {
    id: 0,
    voter: USER2,
    isUpVote: true,
  };

  await createVote(vote);

  const result = await getActivity(0);
  expect(result.upVote).toBe(2);
  expect(result.voteResult.length).toBe(2);
});

test('user3 and user4 vote down', async () => {
  const vote1 = {
    id: 0,
    voter: USER3,
    isUpVote: false,
  } as IVotedOptionsFromEvent;

  const vote2 = {
    id: 0,
    voter: USER4,
    isUpVote: false,
  } as IVotedOptionsFromEvent;

  await createVote(vote1);
  await createVote(vote2);

  const result = await getActivity(0);
  expect(result.downVote).toBe(2);
  expect(result.voteResult.length).toBe(4);
});

test('modify rewardParameter and consumption', async () => {
  const newConsumption = {
    newPrice: toUFix64(95),
  } as IConsumptionUpdatedFromEvent;
  await consumptionUpdated(newConsumption);
  const result = await getLastEconomicFactor();
  expect(result.createConsumption).toEqual(95);
  const newRewardParameterToUpdate = {
    newParams: {
      maxRatio: toUFix64(6.0),
      minRatio: toUFix64(1.0),
      averageRatio: toUFix64(1.6),
      asymmetry: toUFix64(2.0),
    },
  } as IRewardParameterUpdatedFromEvent;

  await rewardParameterUpdated(newRewardParameterToUpdate);
  const result2 = await getLastEconomicFactor();
  expect(result2.maxRatio).toEqual(6);
  expect(result2.averageRatio).toEqual(1.6);
});

test('close activity when negative vote', async () => {
  await closeActivity({ id: 0 });
  const result2 = await getActivity(0);
  expect(result2.lockDate).not.toBe(null);
  expect(result2.closed).toBe(true);
  expect(result2.rewardToken).toEqual(0);

  // create memorial record manually
  const memorials0Data = {
    version: 1,
    reciever: USER3,
    memorialId: 1,
    seriesNumber: 1,
    circulatingCount: 2,
    activityID: 0,
    isPositive: false,
    bonus: toUFix64(result2.bouns),
  };

  const memorials1Data = {
    version: 1,
    reciever: USER4,
    memorialId: 2,
    seriesNumber: 2,
    circulatingCount: 2,
    activityID: 0,
    isPositive: false,
    bonus: toUFix64(result2.bouns),
  };

  await createMemorial(memorials0Data);
  await createMemorial(memorials1Data);
});

test('can create new activity (positive)', async () => {
  const metadata = JSON.stringify({
    content: `NFT GIVEAWAY
    The most exciting #NFT collection of the year is coming to #Tezos soon; incubated by
    @DGHLabs.

    Enter to win one of 5 super rare NFTs by:
    - Following
    @LuckyCrabClub
    - Retweeting this tweet
    - Tagging 3 friends in the comments`,
    startDate: moment('2021-09-26 03:07+08:00'),
    endDate: moment('2021-10-02 00+08:00'),
    source: 'https://twitter.com/LuckyCrabClub/status/1442022933715582978',
    categories: ['LuckDraw'],
  });

  const activity = {
    id: 1,
    title: 'XYZ链第三个生成NFT的转发空投',
    metadata,
    creator: USER1,
  } as ICreateOptionsFromEvent;

  const result = await createActivity(activity);

  expect(result.id).toEqual(1);
  expect(result.createdAt).not.toBeNull();
  expect(result.updatedAt).not.toBeNull();
  expect(result.startDate).not.toBeNull();
  expect(result.endDate).not.toBeNull();
  expect(result.source).not.toBeNull();
  expect(result.closed).toBe(false);

  const vote = {
    id: 1,
    voter: USER3,
    isUpVote: true,
  } as IVotedOptionsFromEvent;

  await createVote(vote);

  const result2 = await getActivity(1);
  expect(result2.upVote).toBe(2);
  expect(result2.voteResult.length).toBe(2);
  expect(result2.absTotalPower).toBeNull();
  expect(result2.bouns).toBeNull();
  await closeActivity({ id: 1 });
  const result3 = await getActivity(1);
  expect(result3.lockDate).not.toBe(null);
  expect(result3.closed).toBe(true);
  expect(result3.rewardToken).not.toEqual(0);
  expect(result3.absTotalPower).not.toBeNull();
  expect(result3.bouns).not.toBeNull();
});

test('activities queryMany', async () => {
  function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  function getRandomElements() {
    const enumLength = 11;
    if (Math.random() > 0.5) {
      return [userValidActivityTypeEnum[getRandomInt(0, enumLength)]];
    } else {
      const indexA = getRandomInt(0, enumLength);
      const indexB = getRandomInt(0, enumLength);
      const elementA = userValidActivityTypeEnum[indexA];
      const elementB = userValidActivityTypeEnum[indexB];
      if (indexA === indexB) {
        return [elementA];
      } else {
        return [elementA, elementB];
      }
    }
  }

  for (let i = 2; i < 100; i++) {
    const categories = getRandomElements();
    await createActivity({
      id: i,
      title: faker.commerce.productName(),
      metadata: JSON.stringify({
        content: faker.commerce.productDescription(),
        startDate: moment(faker.date.past()),
        endDate: moment(faker.date.future()),
        source: faker.internet.url(),
        categories,
      }),
      creator: USER1,
    });
  }

  const result1 = await getActivities({});

  const total = result1[1];
  expect(result1[0].length).toBe(10);

  const result2 = await getActivities({ type: 'Register' });
  expect(result2[0].length).toBeLessThan(total);
  expect(result2[1]).toBeLessThan(total);

  const result3 = await getActivities({
    type: 'Register',
    canJoin: true,
    address: USER1,
  });
  const result3_2 = await getActivities({
    type: 'Register',
    canJoin: true,
    canVote: true,
    address: USER1,
  });
  expect(result3_2[1]).toBeLessThan(result3[1]);
}, 30000);

test('update metadata', async () => {
  const result = await modifyMetadata(0, {
    content: '活动已经结束',
    endDate: moment('2021-10-05 09+08:00'),
  });
  expect(result.content).toBe('活动已经结束');
  expect(result.metadata['content']).toBe('活动已经结束');
  expect(result.endDate).not.toBeNull();
  expect(result.metadata['endDate']).not.toBeNull();
});
