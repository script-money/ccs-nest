import { Module, CacheModule } from '@nestjs/common';
import { ConfigModule } from 'nestjs-config';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { UserService } from './service/user.service';
import { ActivityService } from './service/activity.service';
import { MemorialsService } from './service/memorials.service';
import { CCSTokenService } from './service/ccsToken.service';
import { AppController } from './app.controller';
import { FlowService } from './service/flow.service';
import { BlockCursorService } from './service/blockCursor.service';
import { PrismaService } from './service/prisma.service';
import { ActivityTask } from './task/activity';
import { TaskUtils } from './task/utils';
import { CCSTokenTask } from './task/ccsToken';
import { BallotTask } from './task/ballot';
import { MemorialsTask } from './task/memorials';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.load(path.resolve(__dirname, 'config', '**/!(*.d).{ts,js}'), {
      path: path.resolve(process.cwd(), !ENV ? '.env' : `.env.${ENV}`),
    }),
    CacheModule.register(),
    ScheduleModule.forRoot(),
  ],
  providers: [
    UserService,
    ActivityService,
    MemorialsService,
    CCSTokenService,
    FlowService,
    BlockCursorService,
    PrismaService,
    TaskUtils,
    ActivityTask,
    BallotTask,
    CCSTokenTask,
    MemorialsTask,
  ],
  controllers: [AppController],
})
export class AppModule {}
