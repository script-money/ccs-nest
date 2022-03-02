import { HttpService } from '@nestjs/axios';
import { Injectable, Inject, HttpStatus, Logger } from '@nestjs/common';
import moment from 'moment';
import { catchError, lastValueFrom, map, throwError } from 'rxjs';
import { UserUpdateDiscordDTO } from 'src/dto/user';

import {
  IRecommendActivity,
  IActivityToDiscord,
  getCategoriesNameList,
} from 'src/interface/activity';
import {
  IAccessTokenResponse,
  IDiscordUserInfoResponse,
} from 'src/interface/discord';
import { UserService } from './user.service';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(
    @Inject(UserService) private readonly userService: UserService,
    private httpService: HttpService,
  ) {}

  async updateDiscordInfo({ code, state }: UserUpdateDiscordDTO) {
    const OAuthScope = ['identify'].join(' ');
    const address = state;
    const tokenRequestData = new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${process.env.DOMAIN}`,
    });

    try {
      const observableAccessTokenResponse = this.httpService
        .post<IAccessTokenResponse>(
          'https://discordapp.com/api/v9/oauth2/token',
          tokenRequestData,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        )
        .pipe(map((response) => response.data));

      const data = await lastValueFrom(observableAccessTokenResponse);

      if (data.scope !== OAuthScope) {
        return {
          success: false,
          data: [],
          total: 0,
          errorCode: HttpStatus.FORBIDDEN,
          errorMessage: 'discord token is not vaild',
          showType: 2,
        };
      }

      const observableUserInfoResponse = this.httpService
        .get<IDiscordUserInfoResponse>(
          'https://discordapp.com/api/v9/users/@me',
          {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          },
        )
        .pipe(map((response) => response.data));

      const user = await lastValueFrom(observableUserInfoResponse);

      return await this.userService.updateByDiscord({
        address,
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        discriminator: user.discriminator, // such as 0001
      });
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        data: [],
        total: 0,
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorMessage: `unknow error when update user discord info: ${error}`,
        showType: 2,
      };
    }
  }

  async sendActivity(activity: IRecommendActivity) {
    const formatActivity: IActivityToDiscord = {
      id: activity.id,
      title: activity.title,
      content: activity.content === '' ? undefined : activity.content,
      source: activity.source === '' ? undefined : activity.source,
      link: process.env.DOMAIN + '/activity/' + activity.id,
      startDate:
        activity.startDate === null
          ? undefined
          : moment.tz(activity.startDate, 'Asia/Shanghai').format('YYYY-MM-DD'),
      endDate:
        activity.endDate === null
          ? undefined
          : moment.tz(activity.endDate, 'Asia/Shanghai').format('YYYY-MM-DD'),
      categories: getCategoriesNameList(activity.categories),
    };

    const value = `
    ----------------------------------------------------------
    名称: ${formatActivity.title}
    介绍: ${formatActivity.content ?? '暂无'}
    来源: ${formatActivity.source ?? '暂无'}
    类型: ${formatActivity.categories.join('/')}
    开始日期: ${formatActivity.startDate}
    结束日期: ${formatActivity.endDate ?? '暂无'}
    投票链接: ${formatActivity.link}
    `;
    console.log(value);
    const webhookUrl = `https://discordapp.com/api/v9/webhooks/${process.env.WEBHOOK_ID}/${process.env.WEBHOOK_TOKEN}`;
    const observableResponse = this.httpService
      .post(webhookUrl, JSON.stringify({ content: value }), {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
        params: {
          wait: true,
        },
      })
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          this.logger.error('discord webhook api error:', err);
          return throwError(err);
        }),
      );

    const createResponse = await lastValueFrom(observableResponse);
    console.log(createResponse);
  }
}
