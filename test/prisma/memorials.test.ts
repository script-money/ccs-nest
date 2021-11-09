import {
  closeActivity,
  createActivity,
  createVote,
  getActivity,
} from '../../src/orm/activity';
import { USER1, USER2, toUFix64 } from '../../src/orm/clientForTest';
import moment from 'moment';
import {
  ICreateOptionsFromEvent,
  IVotedOptionsFromEvent,
} from '../../src/interface/activity';
import {
  createMemorial,
  depositMemorials,
  getMemorial,
  getMemorialsByActivity,
  getMemorialsByUser,
} from '../../src/orm/momerials';
import { getUser } from '../../src/orm/user';

test('can save memorials to database', async () => {
  const metadata = JSON.stringify({
    content: 'https://twitter.com/Fantom_Husky/status/1441994927299129347',
    startDate: moment('2021-09-26 01:15+08:00'),
    endDate: null,
    categories: ['Form', 'Register'],
  });

  const activity = {
    id: 1,
    title: 'FantomHusky Airdrop, First Come First Served 4, 000 Participants',
    metadata,
    creator: USER1,
  } as ICreateOptionsFromEvent;

  await createActivity(activity);

  const vote0 = {
    id: 1,
    voter: USER2,
    isUpVote: true,
  } as IVotedOptionsFromEvent;

  await createVote(vote0);

  await closeActivity({ id: 1 });
  const result = await getActivity(1);

  const memorials0Data = {
    version: 1,
    reciever: USER1,
    memorialId: 1,
    seriesNumber: 1,
    circulatingCount: 2,
    activityID: 1,
    isPositive: result.rewardToken > 0,
    bonus: toUFix64(result.bouns),
  };

  const memorials1Data = {
    version: 1,
    reciever: USER2,
    memorialId: 2,
    seriesNumber: 2,
    circulatingCount: 2,
    activityID: 1,
    isPositive: result.rewardToken > 0,
    bonus: toUFix64(result.bouns),
  };

  await createMemorial(memorials0Data);
  await createMemorial(memorials1Data);

  const memorial1 = await getMemorial(1);
  expect(memorial1.id).toBe(1);
  expect(memorial1.activity.categories.length).toBe(2);
  expect(memorial1.seriesNumber).toBe(1);
  expect(memorial1.circulatingCount).toBe(2);
  expect(memorial1.bonus).toBe(0.01);

  const memorial2 = await getMemorial(2);
  expect(memorial2.id).toBe(2);
  expect(memorial2.activity.categories.length).toBe(2);
  expect(memorial2.seriesNumber).toBe(2);
  expect(memorial2.circulatingCount).toBe(2);
  expect(memorial2.bonus).toBe(0.01);

  const depositData1 = {
    id: 1,
    to: USER1,
  };
  const depositData2 = {
    id: 2,
    to: USER2,
  };

  await depositMemorials(depositData1);
  await depositMemorials(depositData2);

  const user1 = await getUser(USER1);
  expect(user1.votingPower).toEqual(0.02);
  const user2 = await getUser(USER2);
  expect(user2.votingPower).toEqual(0.02);

  const memorials1 = await getMemorialsByActivity(1);
  expect(memorials1.length).toEqual(2);

  const memorials2 = await getMemorialsByUser(USER1);
  expect(memorials2[0].id).toBe(1);
});
