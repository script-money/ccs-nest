import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';
import { PrismaService } from './prisma.service';
import { FlowService } from './flow.service';

@Injectable()
export class BlockCursorService {
  private startHeight: number;
  constructor(
    private readonly config: ConfigService,
    private prismaClient: PrismaService,
    @Inject(forwardRef(() => FlowService))
    private readonly flowService: FlowService,
  ) {
    this.startHeight = config.get(`${config._env()}.startHeight`);
  }

  async findOrCreateLatestBlockCursor(eventName: string) {
    let blockCursor = await this.prismaClient.blockCursor.findFirst({
      where: {
        eventName,
      },
    });

    if (!blockCursor) {
      blockCursor = await this.prismaClient.blockCursor.create({
        data: {
          eventName,
          currentHeight:
            this.startHeight ?? (await this.flowService.getLatestBlockHeight()),
        },
      });
    }
    return blockCursor;
  }

  async updateBlockCursorById(id: number, currentBlockHeight: number) {
    await this.prismaClient.blockCursor.update({
      where: {
        id: id,
      },
      data: {
        currentHeight: currentBlockHeight,
      },
    });
  }
}
