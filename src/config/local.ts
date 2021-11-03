import * as config from './dapp-config.json';

const fungibleToken = config.contracts['Flow.FungibleToken'];
const activityContract = config.contracts['Project.ActivityContract'];
const ballotContract = config.contracts['Project.BallotContract'];
const ccsToken = config.contracts['Project.CCSToken'];
const memorials = config.contracts['Project.Memorials'];
const nonFungibleToken = config.contracts['Flow.NonFungibleToken'];

const shortQueryBlock = 20; // fit every 20 seconds
const midRangeQueryBlock = 60; // fit greater than 1 minute
const maxRangeQueryBlock = 250;
const closeActivityIntervalMinutes = 3;
const startHeight = 0;

const minterFlowAddress = config.wallets[0].address;
const minterKeys = [config.wallets[0].keys[0]];

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
