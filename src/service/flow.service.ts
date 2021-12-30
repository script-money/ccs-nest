import * as fcl from '@onflow/fcl';
import { ec as EC } from 'elliptic';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { SHA3 } from 'sha3';
const ec: EC = new EC('p256');
import {
  Account,
  Address,
  Event,
  flowInteractOptions,
  FlowTxData,
  GetEventsOptions,
  Key,
  signable,
} from '../interface/flow';
import { BlockCursorService } from './blockCursor.service';
import {
  Logger,
  Inject,
  Injectable,
  CACHE_MANAGER,
  forwardRef,
} from '@nestjs/common';
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
  public minterKeys: Key[];
  private fungibleToken: Address;
  private activityContract: Address;
  private ballotContract: Address;
  private ccsToken: Address;
  private nonFungibleToken: Address;
  private memorials: Address;
  private readonly logger = new Logger(FlowService.name);

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
      .then((d: string) => this.logger.log('Flow Connect to', d));
  }

  authorizeMinter(keyToUse: Key) {
    if (keyToUse === undefined) {
      return;
    }
    return async (account: Account) => {
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

  private async getFreeKey() {
    const seqNumberValue = await this.cacheManager.get('seqNumber');
    let seqNumber = seqNumberValue ? Number(seqNumberValue) : 0;
    let keyIndexToUse = seqNumber % this.minterKeys.length;
    let keyToUse = this.minterKeys[keyIndexToUse];
    while (keyToUse.revoked) {
      seqNumber++;
      keyIndexToUse++;
      keyToUse = this.minterKeys[keyIndexToUse];
    }
    this.logger.log('keyToUse', keyToUse);
    await this.cacheManager.set('seqNumber', seqNumber + 1);
    return keyToUse;
  }

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
    this.logger.log('option', option);
    const keyToUse = await this.getFreeKey();
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

    this.logger.log(
      `query ${key} from ${savedCursor.currentHeight + 1} to ${endBlock}`,
    );

    try {
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
    } catch (error) {
      this.logger.warn(
        // eslint-disable-next-line prettier/prettier
        `get Range error ${error} at ${savedCursor.currentHeight + 1
        } to ${endBlock} when process ${eventName}  `,
      );
      await this.blockCursorService.updateBlockCursorById(
        savedCursor.id,
        savedCursor.currentHeight + 1,
      );
      throw new Error(error);
    }
  }

  TPSAccountResolver = async (account: Account) => {
    const tpsPayerAddress = this.minterFlowAddress;
    const tpsPayerKeyID = 0;
    const tpsTempID = `${tpsPayerAddress}-${tpsPayerKeyID}`;
    return {
      ...account,
      tempId: tpsTempID,
      addr: tpsPayerAddress,
      keyId: 0,
    };
  };

  TPSSigner = async (signable: signable) => {
    const signablePayerAddress = signable.voucher.payer;
    // For security, ensure that `signablePayerAddress` is not specified as a transaction authorizer or proposer.
    if (signable.voucher.authorizers.includes(signablePayerAddress)) {
      throw new Error(
        `TPSSigner Error: signablePayerAddress=${signablePayerAddress} specified as a transaction authorizer in transaction signable.`,
      );
    }
    if (signable.voucher.proposalKey.address === signablePayerAddress) {
      throw new Error(
        `TPSSigner Error: signablePayerAddress=${signablePayerAddress} specified as the transaction proposer in transaction signable.`,
      );
    }
    const encodedMessage = fcl.WalletUtils.encodeMessageFromSignable(
      signable,
      this.minterFlowAddress,
    );
    const keyToUse = this.minterKeys[0];
    const signature = this.signWithKey(keyToUse.privateKey, encodedMessage);
    return {
      addr: signablePayerAddress,
      keyId: keyToUse.keyId,
      signature,
    };
  };
}
