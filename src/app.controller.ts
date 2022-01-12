import {
  Body,
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
import { Account } from './interface/flow';
import { IGetMemorialsResponse } from './interface/momerials';
import { IGetUserResponse } from './interface/user';
import { IResponse } from './interface/utils';
import { ActivityService } from './service/activity.service';
import { CCSTokenService } from './service/ccsToken.service';
import { FlowService } from './service/flow.service';
import { MemorialsService } from './service/memorials.service';
import { UserService } from './service/user.service';
import { DiscordService } from './service/discord.service';
import { UserUpdateDiscordDTO } from './dto/user';

@Controller('api')
export class AppController {
  constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(ActivityService) private readonly activityService: ActivityService,
    @Inject(MemorialsService)
    private readonly memorialsService: MemorialsService,
    @Inject(CCSTokenService)
    private readonly ccsTokenService: CCSTokenService,
    @Inject(FlowService) private readonly flowService: FlowService,
    @Inject(DiscordService) private readonly discordService: DiscordService,
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
    @Body() updateOptions: IModifyOptions,
  ): Promise<IGetActivityResponse> {
    const result = await this.activityService.updateOne(updateOptions);
    return result;
  }

  @Post('/activity/parameterUpdate')
  async updateParameters(@Query('key') key: string): Promise<IResponse> {
    const result = await this.activityService.parameterUpdate(key);
    return result;
  }

  @Get('/activity/pushToDiscord')
  async pushToDiscord() {
    return await this.activityService.pushToDiscord();
  }

  // token
  @Post('/token/free')
  async requestFreeToken(
    @Query() option: { address: string },
  ): Promise<IRequestFreeTokenResponse> {
    const result = await this.ccsTokenService.requestFree(option.address);
    return result;
  }

  @Post('/token/airdropUpdate')
  async updateAirdrop(@Query('key') key: string): Promise<IResponse> {
    const result = await this.ccsTokenService.airdropUpdate(key);
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

  @Post('/resolve-account')
  async resolveaccount(@Body() account: Account): Promise<Account> {
    const resolveaccount = await this.flowService.TPSAccountResolver(account);
    return resolveaccount;
  }

  @Post('/sign')
  async sign(@Body() signable: any) {
    const compositeSignature = await this.flowService.TPSSigner(signable);
    return compositeSignature;
  }

  @Get('/user/update-discord')
  async updateUserDiscordInfo(
    @Query() params: UserUpdateDiscordDTO,
  ): Promise<IResponse> {
    return await this.discordService.updateDiscordInfo(params);
  }
}
