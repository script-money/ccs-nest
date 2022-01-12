import { Inject, Injectable, Logger } from '@nestjs/common';
import { BlockCursorService } from '../service/blockCursor.service';
import { FlowService } from '../service/flow.service';
import * as fcl from '@onflow/fcl';
import { Event } from '../interface/flow';

export const SHORT_INTERVAL = '*/20 * * * * *'; // every 20 seconds
export const MID_INTERVAL = '*/3 * * * *'; // every 3 minutes
export const LONG_INTERVAL = '*/1 * * *'; // every hour

@Injectable()
export class TaskUtils {
  private readonly logger = new Logger(TaskUtils.name);

  constructor(
    @Inject(BlockCursorService)
    private readonly blockCursorService: BlockCursorService,
    @Inject(FlowService)
    private readonly flowService: FlowService,
  ) {}

  /**
   * Listening for events and calling specific orm functions
   * @param contractAddr address of contract
   * @param contractName name of contract
   * @param eventName eventname of contract
   * @param ormFunction orm funtion to call
   * @param queryBlockRange: get events range per request
   * @param lastBlock?: if lastBlock is set, jump request height from blockchain
   * @returns Promise<number> last block
   */
  async saveEventsToDB(
    contractAddr: string,
    contractName: string,
    eventName: string,
    ormFunction: (evenData: any) => Promise<any>,
    queryBlockRange: number,
    lastBlock?: number,
  ): Promise<number> {
    const blockCursor =
      await this.blockCursorService.findOrCreateLatestBlockCursor(eventName);
    const initStartBlock = blockCursor.currentHeight;

    if (!lastBlock) {
      lastBlock = await this.flowService.getLatestBlockHeight();
      this.logger.log(`Get ${eventName} newest blockheight is ${lastBlock}`);
    }
    const interval = lastBlock - initStartBlock;

    if (interval < 0) {
      console.warn(
        'Cursor.height is greater than block height, run `npx prisma migrate reset` first',
      );
      return;
    }

    const epoch = Math.floor(interval / queryBlockRange);
    if (epoch === 0) {
      this.logger.log(
        `${eventName} interval is ${interval}, wait for next query`,
      );
      return;
    }

    // if block behind a lot, should send N blocks per request to catch up
    for (const i of [...Array(epoch).keys()]) {
      const queryEndAt = initStartBlock + (i + 1) * queryBlockRange;

      let result = undefined;
      while (result === undefined) {
        try {
          result = await this.flowService.getEvents({
            contractAddr: fcl.sansPrefix(contractAddr),
            contractName,
            eventName,
            endBlock: Math.min(queryEndAt, lastBlock),
          });

          if (result !== undefined && result.length !== 0) {
            result.forEach(async (event: Event) => {
              this.logger.log(
                `save ${ormFunction.name} event to db`,
                event.data,
              );
              await ormFunction(event.data);
            });
          }
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }
    return lastBlock;
  }

  /**
   * scan last events and call specific orm functions
   * @param contractAddr address of contract
   * @param contractName name of contract
   * @param eventName eventname of contract
   * @param ormFunction orm funtion to call
   * @param queryBlockRange get events range per request
   * @returns is any update
   */
  async saveLastEventToDB(
    contractAddr: string,
    contractName: string,
    eventName: string,
    ormFunction: (evenData: any) => Promise<any>,
    queryBlockRange: number,
  ): Promise<void> {
    if (contractAddr === null) {
      this.logger.error(`${eventName} contractAddr is null`);
      return;
    }
    const startCursor =
      await this.blockCursorService.findOrCreateLatestBlockCursor(eventName);
    const startHeight = startCursor.currentHeight;
    this.logger.log(`current cursor's startHeight is ${startHeight}`);
    const lastBlock = await this.flowService.getLatestBlockHeight();
    let tempCursor = lastBlock;
    const key = `A.${fcl.sansPrefix(
      contractAddr,
    )}.${contractName}.${eventName}`;
    this.logger.log(`Get ${key}, newest blockheight is ${lastBlock}`);

    let result = undefined;
    while (result === undefined && startHeight <= tempCursor) {
      try {
        const startBlock = Math.max(startHeight, tempCursor - queryBlockRange);
        if (startBlock === tempCursor) {
          result = false;
          break;
        }

        const events: Event[] = await fcl
          .send([fcl.getEventsAtBlockHeightRange(key, startBlock, tempCursor)])
          .then(fcl.decode);

        if (events !== undefined && events.length !== 0) {
          events.forEach(async (event: Event) => {
            this.logger.log(`save ${ormFunction.name} event to db`, event.data);
            await ormFunction(event.data);
          });
          result = true;
        } else {
          tempCursor = startBlock;
        }
      } catch (error) {
        this.logger.warn(`error in saveEventToDB ${error}`);
        result = false;
        break;
      }
    }

    // update event cursor
    const savedCursor =
      await this.blockCursorService.findOrCreateLatestBlockCursor(eventName);
    await this.blockCursorService.updateBlockCursorById(
      savedCursor.id,
      lastBlock + 1,
    );
    this.logger.log(`update ${eventName} cursor to ${lastBlock + 1}`);
  }
}
