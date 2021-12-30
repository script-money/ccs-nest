import {
  Injectable,
  HttpStatus,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import { ConfigService } from 'nestjs-config';
import { FlowService } from './flow.service';
import { IRequestFreeTokenResponse } from '../interface/ccsToken';
import { toUFix64 } from '../orm/clientForTest';
import {
  getHistory as getFacuetHistory,
  addFacuetRecord as addFacuetRecordToDB,
} from '../orm/ccsToken';
import { CCSTokenTask } from 'src/task/ccsToken';
import { IResponse } from 'src/interface/utils';

@Injectable()
export class CCSTokenService {
  private readonly logger = new Logger(CCSTokenService.name);

  facuetAmount: number;
  constructor(
    private readonly config: ConfigService,
    @Inject(FlowService) private readonly flowService: FlowService,
    @Inject(forwardRef(() => CCSTokenTask))
    private readonly ccsTokenTask: CCSTokenTask,
  ) {
    this.facuetAmount = config.get(`${config._env()}.facuetAmount`);
  }

  async requestFree(addr: string): Promise<IRequestFreeTokenResponse> {
    try {
      const result = await getFacuetHistory(addr);
      if (result !== null) {
        return {
          success: true,
          data: result,
          errorCode: HttpStatus.ACCEPTED,
          errorMessage: 'user already request free tokens',
          showType: 1,
        };
      }

      const txResult = await this.flowService.sendTxByAdmin({
        path: 'CCSToken/mint_tokens_and_distribute.cdc',
        args: [
          fcl.arg(
            [{ key: addr, value: toUFix64(this.facuetAmount) }],
            t.Dictionary({ key: t.Address, value: t.UFix64 }),
          ),
        ],
      });

      if (txResult) {
        await addFacuetRecordToDB(addr);
        return {
          success: true,
          data: null,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.ACCEPTED,
        errorMessage: error.toString().split('\n')[0],
        showType: 1,
      };
    }
  }

  async airdropUpdate(privateKey: string): Promise<IResponse> {
    if (
      !this.flowService.minterKeys.some((key) => key.privateKey === privateKey)
    ) {
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.NOT_ACCEPTABLE,
        errorMessage: `You should use admin key to update parameter`,
        showType: 1,
      };
    }

    try {
      await this.ccsTokenTask.ccsTokensAirdrop();
      return {
        success: true,
        data: 'airdrop sync success or not modify',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        errorCode: HttpStatus.NOT_MODIFIED,
        errorMessage: `You can't update airdrop info: ${error}`,
        showType: 1,
      };
    }
  }
}
