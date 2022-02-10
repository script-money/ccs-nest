const fungibleToken = '0x9a0766d93b6608b7';
const activityContract = process.env.MINTER_ADDRESS;
const ballotContract = process.env.MINTER_ADDRESS;
const ccsToken = process.env.MINTER_ADDRESS;
const memorials = process.env.MINTER_ADDRESS;
const nonFungibleToken = '0x631e88ae7f1d7c20';

const shortQueryBlock = 20; // fit every 20 seconds
const midRangeQueryBlock = 60; // fit greater than 1 minute
const maxRangeQueryBlock = 250;
const closeActivityIntervalMinutes = 3; // 1 day = 60 * 24
const startHeight = Number(process.env.START_HEIGHT); // check at https://testnet.flowscan.org/

const minterFlowAddress = process.env.MINTER_ADDRESS;
const minterKeys = [
  {
    publicKey: process.env.PUBLICKEY_0,
    privateKey: process.env.PRIVATEKEY_0,
    keyId: 0,
    weight: 1000,
    revoked: false,
  },
  {
    publicKey: process.env.PUBLICKEY_6,
    privateKey: process.env.PRIVATEKEY_6,
    keyId: 6,
    weight: 1000,
    revoked: false,
  },
  {
    publicKey: process.env.PUBLICKEY_7,
    privateKey: process.env.PRIVATEKEY_7,
    keyId: 7,
    weight: 1000,
    revoked: false,
  },
  {
    publicKey: process.env.PUBLICKEY_8,
    privateKey: process.env.PRIVATEKEY_8,
    keyId: 8,
    weight: 1000,
    revoked: false,
  },
  {
    publicKey: process.env.PUBLICKEY_9,
    privateKey: process.env.PRIVATEKEY_9,
    keyId: 9,
    weight: 1000,
    revoked: false,
  },
  {
    publicKey: process.env.PUBLICKEY_10,
    privateKey: process.env.PRIVATEKEY_10,
    keyId: 10,
    weight: 1000,
    revoked: false,
  },
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
