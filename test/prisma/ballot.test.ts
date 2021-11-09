import { USER1, toUFix64 } from '../../src/orm/clientForTest';

import { createBallotBought } from '../../src/orm/ballot';
import { IBallotsBoughtFromEvent } from '../../src/interface/ballot';
import { getTokenChangeRecords } from '../../src/orm/ccsToken';

test('can save ballots bought record to database', async () => {
  const ballotBoughtEventData = {
    amount: 5,
    buyer: USER1,
    price: toUFix64(1.0),
  } as IBallotsBoughtFromEvent;

  const result = await createBallotBought(ballotBoughtEventData);
  expect(result.amount).toEqual(5);
  expect(result.price).toEqual(1);
  expect(result.buyerAddress).toBe(USER1);

  const result2 = await getTokenChangeRecords({});
  const record = result2.pop();
  expect(record.type).toBe('BuyBallot');
  expect(record.amount).toBe(-5);
  expect(record.userAddress).toBe(USER1);
});
