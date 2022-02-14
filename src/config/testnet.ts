const fungibleToken = '0x9a0766d93b6608b7';
const activityContract = process.env.MINTER_ADDRESS;
const ballotContract = process.env.MINTER_ADDRESS;
const ccsToken = process.env.MINTER_ADDRESS;
const memorials = process.env.MINTER_ADDRESS;
const nonFungibleToken = '0x631e88ae7f1d7c20';

const shortQueryBlock = 20; // fit every 20 seconds
const midRangeQueryBlock = 60; // fit greater than 1 minute
const maxRangeQueryBlock = 250;
const closeActivityIntervalMinutes = 60 * 24; // 1 day = 60 * 24
const startHeight = Number(process.env.START_HEIGHT); // check at https://testnet.flowscan.org/

const minterFlowAddress = process.env.MINTER_ADDRESS;
const minterKeys = [
  {
    publicKey: process.env.PUBLICKEY_TEST,
    privateKey: process.env.PRIVATEKEY_TEST,
    keyId: 0,
    weight: 1000,
    revoked: false,
  },
  ...[...Array(10).keys()].map((i, index) => ({
    publicKey: process.env.PUBLICKEY_TEST,
    privateKey: process.env.PRIVATEKEY_TEST,
    keyId: index + 1,
    weight: 0,
    revoked: false,
  })),
];

const facuetAmount = 1000;
const HTTP_TIMEOUT = 5000;
const HTTP_RETRY_COUNT = 3;

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
  HTTP_TIMEOUT,
  HTTP_RETRY_COUNT,
};
