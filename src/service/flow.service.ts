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
  OnModuleInit,
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
export class FlowService implements OnModuleInit {
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

  onModuleInit() {
    // find if ../../../cadence/transactions/ folder exists
    const transactionsFolder = join(__dirname, '../../../cadence/transactions');
    if (!existsSync(transactionsFolder)) {
      this.logger.error(
        '❌❌❌ No cadence transactions folder found, please copy it to root folder',
      );
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    } else {
      this.logger.log('Found cadence transactions folder.');
    }
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

  private async getFreeKey(keyOffset: number): Promise<Key> {
    const maxLoop = this.minterKeys.length;
    if (keyOffset > maxLoop) {
      this.logger.warn(
        `keyOffset ${keyOffset} is greater than maxLoop ${maxLoop}`,
      );
      return;
    }
    for (let i = 0; i < maxLoop - keyOffset; i++) {
      const isUsing = await this.cacheManager.get<boolean>(
        (i + keyOffset).toString(),
      );

      if (isUsing === undefined || !isUsing) {
        await this.cacheManager.set((i + keyOffset).toString(), true, {
          ttl: 3,
        });
        return this.minterKeys[i + keyOffset];
      } else {
        this.logger.log(`Key ${i + keyOffset} is already in use`);
        continue;
      }
    }
    throw new Error('No free key found');
  }

  async sendTx({
    transaction,
    args,
    proposer,
    authorizations,
    payer,
  }): Promise<{ txId: { transactionId: string }; data: FlowTxData }> {
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
    try {
      const block = await fcl.send([fcl.getBlock(true)]);
      const decoded = await fcl.decode(block);
      return decoded.height;
    } catch (error) {
      this.logger.warn('Error getting latest block height', error);
    }
  }

  async sendTxByAdmin(option: flowInteractOptions, keyOffset = 0) {
    const firstKey = this.minterKeys[0];
    let proposerKey;
    let result = false;
    while (!result) {
      try {
        proposerKey = await this.getFreeKey(keyOffset);
        result = true;
      } catch (error) {
        this.logger.log('Waiting for free key');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    const payerAndAuthorization = this.authorizeMinter(firstKey);
    const proposeAuthorization = this.authorizeMinter(proposerKey);
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

    let retries = 0;
    let txResult = false;
    while (!txResult && retries <= 3) {
      const { txId, data } = await this.sendTx({
        transaction,
        args: option.args,
        authorizations: [payerAndAuthorization],
        payer: payerAndAuthorization,
        proposer: proposeAuthorization,
      });
      if (data.errorMessage !== '') {
        this.logger.warn(
          `sendTxByAdmin error ${data.errorMessage}, retry ${retries}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        retries++;
        continue;
      } else {
        txResult = true;
        this.logger.log('flowInteractOptions:', option);
        this.logger.log(`${txId.transactionId}`);
        return txId;
      }
    }
    this.logger.warn(`sendTxByAdmin(retry max) error when run: ${option}`);
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
    const tpsTempID = `${tpsPayerAddress} - ${tpsPayerKeyID}`;
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
        `TPSSigner Error: signablePayerAddress = ${signablePayerAddress} specified as a transaction authorizer in transaction signable.`,
      );
    }
    if (signable.voucher.proposalKey.address === signablePayerAddress) {
      throw new Error(
        `TPSSigner Error: signablePayerAddress = ${signablePayerAddress} specified as the transaction proposer in transaction signable.`,
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
