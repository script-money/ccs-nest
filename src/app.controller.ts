import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ActivitiesGetDTO } from './dto/activity';
import { MemorialsGetDTO } from './dto/memorials';
import {
  IGetActivitiesResponse,
  IGetActivityResponse,
  IModifyOptions,
} from './interface/activity';
import { IRequestFreeTokenResponse } from './interface/ccsToken';
import { IGetMemorialsResponse } from './interface/momerials';
import { IGetUserResponse } from './interface/user';
import { ActivityService } from './service/activity.service';
import { CCSTokenService } from './service/ccsToken.service';
import { MemorialsService } from './service/memorials.service';
import { UserService } from './service/user.service';

@Controller('api')
export class AppController {
  constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(ActivityService) private readonly activityService: ActivityService,
    @Inject(MemorialsService)
    private readonly memorialsService: MemorialsService,
    @Inject(CCSTokenService)
    private readonly ccsTokenService: CCSTokenService,
  ) {}
  // user
  @Get('/user/:address')
  async getUser(@Param('address') address: string): Promise<IGetUserResponse> {
    const result = await this.userService.queryOne(address);
    return result;
  }

  // activity
  @Get('/activity/:id')
  async getActivity(@Param('id') id: string): Promise<IGetActivityResponse> {
    const result = await this.activityService.queryOne(Number(id));
    return result;
  }

  @Get('/activity')
  async getActivities(
    @Query() queryOptions: ActivitiesGetDTO,
  ): Promise<IGetActivitiesResponse> {
    const result = await this.activityService.queryMany(queryOptions);
    return result;
  }

  @Put('/activity')
  async updateActivity(
    @Query() queryOptions: IModifyOptions,
  ): Promise<IGetActivityResponse> {
    const result = await this.activityService.updateOne(queryOptions);
    return result;
  }

  // token
  @Post('/token/free')
  async requestFreeToken(
    @Query() option: { address: string },
  ): Promise<IRequestFreeTokenResponse> {
    const result = await this.ccsTokenService.requestFree(option.address);
    return result;
  }

  // memorials
  @Get('/memorials')
  async getMemorials(
    @Query() queryOption: MemorialsGetDTO,
  ): Promise<IGetMemorialsResponse> {
    const result = await this.memorialsService.queryMany(queryOption);
    return result;
  }
}
