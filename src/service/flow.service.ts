import * as fcl from '@onflow/fcl';
import { ec as EC } from 'elliptic';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { SHA3 } from 'sha3';
const ec: EC = new EC('p256');
import {
  Address,
  Event,
  flowInteractOptions,
  FlowTxData,
  GetEventsOptions,
  Key,
} from '../interface/flow';
import { BlockCursorService } from './blockCursor.service';
import { Inject, Injectable, CACHE_MANAGER, forwardRef } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';
import { Cache } from 'cache-manager';

const FungibleTokenPath = '"../../contracts/FungibleToken.cdc"';
const ActivityContractPath = '"../../contracts/ActivityContract.cdc"';
const BallotContractPath = '"../../contracts/BallotContract.cdc"';
const CCSTokenPath = '"../../contracts/CCSToken.cdc"';
const NonFungibleTokenPath = '"../../contracts/NonFungibleToken.cdc"';
const MemorialsPath = '"../../contracts/Memorials.cdc"';

@Injectable()
export class FlowService {
  private minterFlowAddress: Address;
  private minterKeys: Key[];
  private fungibleToken: Address;
  private activityContract: Address;
  private ballotContract: Address;
  private ccsToken: Address;
  private nonFungibleToken: Address;
  private memorials: Address;

  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => BlockCursorService))
    private blockCursorService: BlockCursorService,
  ) {
    const env = config._env();
    this.minterFlowAddress = config.get(`${env}.minterFlowAddress`);
    this.minterKeys = config.get(`${env}.minterKeys`);
    this.fungibleToken = config.get(`${env}.fungibleToken`);
    this.activityContract = config.get(`${env}.activityContract`);
    this.ballotContract = config.get(`${env}.ballotContract`);
    this.ccsToken = config.get(`${env}.ccsToken`);
    this.nonFungibleToken = config.get(`${env}.nonFungibleToken`);
    this.memorials = config.get(`${env}.memorials`);
    config._setFlowConfig();
    fcl
      .config()
      .get('accessNode.api')
      .then((d: string) => console.log('Flow Connect to', d));
  }

  authorizeMinter(keyToUse: Key) {
    if (keyToUse === undefined) {
      return;
    }
    return async (account: any = {}) => {
      const user = await this.getAccount(this.minterFlowAddress);
      const keyId = keyToUse.keyId;

      const sign = this.signWithKey;
      const pk = keyToUse.privateKey;

      return {
        ...account,
        tempId: `${user.address} - ${keyId}`,
        addr: fcl.sansPrefix(user.address),
        keyId: Number(keyId),
        signingFunction: (signable) => {
          return {
            addr: fcl.withPrefix(user.address),
            keyId: Number(keyId),
            signature: sign(pk, signable.message),
          };
        },
      };
    };
  }

  async getAccount(addr: string) {
    const { account } = await fcl.send([fcl.getAccount(addr)]);
    return account;
  }

  private signWithKey = (privateKey: string, message: string) => {
    const key = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'));
    const sha = new SHA3(256);
    sha.update(Buffer.from(message, 'hex'));
    const digest = sha.digest();
    const sig = key.sign(digest);
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, 'be', n);
    const s = sig.s.toArrayLike(Buffer, 'be', n);
    return Buffer.concat([r, s]).toString('hex');
  };

  async sendTx({
    transaction,
    args,
    proposer,
    authorizations,
    payer,
  }): Promise<{ txId: string; data: FlowTxData }> {
    const response = await fcl.send([
      fcl.transaction`
        ${transaction}
      `,
      fcl.args(args),
      fcl.proposer(proposer),
      fcl.authorizations(authorizations),
      fcl.payer(payer),
      fcl.limit(9999),
    ]);
    return { txId: response, data: await fcl.tx(response).onceSealed() };
  }

  async executeScript<T>({ script, args }): Promise<T> {
    const response = await fcl.send([fcl.script`${script}`, fcl.args(args)]);
    return await fcl.decode(response);
  }

  async getLatestBlockHeight(): Promise<number> {
    const block = await fcl.send([fcl.getBlock(true)]);
    const decoded = await fcl.decode(block);
    return decoded.height;
  }

  async sendTxByAdmin(option: flowInteractOptions) {
    console.log('option', option);

    const seqNumberValue = await this.cacheManager.get('seqNumber');
    const seqNumber = seqNumberValue ? Number(seqNumberValue) : 0;
    const keyIndexToUse = seqNumber % this.minterKeys.length;
    console.log('keyIndexToUse:', keyIndexToUse);
    const keyToUse = this.minterKeys[keyIndexToUse];
    await this.cacheManager.set('seqNumber', seqNumber + 1);
    const authorization = this.authorizeMinter(keyToUse);

    let transaction;
    const filePath = join(
      __dirname,
      '../../../cadence/transactions/',
      option.path,
    );

    if (existsSync(filePath)) {
      transaction = readFileSync(filePath, 'utf8')
        .replace(FungibleTokenPath, fcl.withPrefix(this.fungibleToken))
        .replace(ActivityContractPath, fcl.withPrefix(this.activityContract))
        .replace(BallotContractPath, fcl.withPrefix(this.ballotContract))
        .replace(CCSTokenPath, fcl.withPrefix(this.ccsToken))
        .replace(NonFungibleTokenPath, fcl.withPrefix(this.nonFungibleToken))
        .replace(MemorialsPath, fcl.withPrefix(this.memorials));
    } else {
      console.warn(`cdc filepath ${filePath} not exist`);
      return;
    }

    try {
      const { txId } = await this.sendTx({
        transaction,
        args: option.args,
        authorizations: [authorization],
        payer: authorization,
        proposer: authorization,
      });
      return txId;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getEvents({
    contractAddr,
    contractName,
    eventName,
    endBlock,
  }: GetEventsOptions): Promise<Event[]> {
    const key = `A.${contractAddr}.${contractName}.${eventName}`;
    const savedCursor =
      await this.blockCursorService.findOrCreateLatestBlockCursor(eventName);

    if (savedCursor.currentHeight + 1 >= endBlock) return;

    console.log(
      `query ${key} from ${savedCursor.currentHeight + 1} to ${endBlock}`,
    );

    const events: Event[] = await fcl
      .send([
        fcl.getEventsAtBlockHeightRange(
          key,
          savedCursor.currentHeight + 1,
          endBlock,
        ),
      ])
      .then(fcl.decode);
    await this.blockCursorService.updateBlockCursorById(
      savedCursor.id,
      endBlock,
    );
    return events;
  }
}
