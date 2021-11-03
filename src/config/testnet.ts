const fungibleToken = '0x9a0766d93b6608b7';
const activityContract = process.env.MINTER_ADDRESS;
const ballotContract = process.env.MINTER_ADDRESS;
const ccsToken = process.env.MINTER_ADDRESS;
const memorials = process.env.MINTER_ADDRESS;
const nonFungibleToken = '0x631e88ae7f1d7c20';

const shortQueryBlock = 20; // fit every 20 seconds
const midRangeQueryBlock = 60; // fit greater than 1 minute
const maxRangeQueryBlock = 250;
const closeActivityIntervalMinutes = 60 * 24; // 1 day
const startHeight = Number(process.env.START_HEIGHT); // check at https://testnet.flowscan.org/

const minterFlowAddress = process.env.MINTER_ADDRESS;
const minterKeys = [
  {
    publicKey: process.env.PUBLICKEY_0,
    privateKey: process.env.PRIVATEKEY_0,
    keyId: process.env.KEYINDEX_0,
    weight: 1000,
  },
  {
    publicKey: process.env.PUBLICKEY_1,
    privateKey: process.env.PRIVATEKEY_1,
    keyId: process.env.KEYINDEX_1,
    weight: 1000,
  },
  {
    publicKey: process.env.PUBLICKEY_2,
    privateKey: process.env.PRIVATEKEY_2,
    keyId: process.env.KEYINDEX_2,
    weight: 1000,
  },
];

const facuetAmount = 1000;

export default {
  fungibleToken,
  activityContract,
  ballotContract,
  ccsToken,
  memorials,
  nonFungibleToken,
  shortQueryBlock,
  midRangeQueryBlock,
  maxRangeQueryBlock,
  closeActivityIntervalMinutes,
  startHeight,
  minterFlowAddress,
  minterKeys,
  facuetAmount,
};
