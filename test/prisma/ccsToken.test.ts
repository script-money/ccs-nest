import { USER1, toUFix64 } from '../../src/orm/clientForTest';

import { getTokenChangeRecords, tokenAirdrop } from '../../src/orm/ccsToken';
import { ITokenAirdropFromEvent } from '../../src/interface/ccsToken';

test('can ', async () => {
  const eventData = {
    receiver: USER1,
    amount: toUFix64(100.0),
  } as ITokenAirdropFromEvent;

  await tokenAirdrop(eventData);

  const result = await getTokenChangeRecords({});
  const record = result.pop();
  expect(record.type).toBe('Airdrop');
  expect(record.amount).toBe(100);
  expect(record.userAddress).toBe(USER1);
});
