import moment from 'moment';
import {
  Activity,
  ActivityType,
  CategoriesOnActivities,
  Vote,
} from '@prisma/client';
import { Address, compositeSignature, UFix64, UInt64 } from './flow';
import { IResponse } from './utils';

export interface ICreateOptionsFromEvent {
  id: UInt64;
  title: string;
  metadata: string;
  creator: Address;
}

export interface activityCreateEvent {
  data: ICreateOptionsFromEvent;
}

export interface IVotedOptionsFromEvent {
  id: UInt64;
  voter: Address;
  isUpVote: boolean;
}

export interface IClosedOptionsFromEvent {
  id: UInt64;
  bonus: UFix64;
  mintPositive: boolean;
}

export interface IConsumptionUpdatedFromEvent {
  newPrice: UFix64;
}

export interface IRewardParameterUpdatedFromEvent {
  newParams: RewardParameter;
}

export type RewardParameter = {
  maxRatio: UFix64;
  minRatio: UFix64;
  // if get average vote compare past activities, can get averageRatio * createConsumption CCS reward
  averageRatio: UFix64;
  asymmetry: UFix64;
};

export interface IQueryManyOptions {
  limit?: number | string;
  offset?: number | string;
  type?: ActivityType;
  canVote?: boolean;
  address?: Address;
  canJoin?: boolean;
  createBy?: Address;
}

export interface IQueryCalendarViewOptions {
  voter: Address;
  date?: moment.Moment;
}

export interface CalendarViewActivity {
  id: number;
  title: string;
  endDate: string | null;
  content: string;
  source: string;
  categories: string[];
}

export interface IGetCalendarViewActivitiesResponse extends IResponse {
  data: CalendarViewActivity[] | null;
}

export interface IModifyOptions {
  id: number;
  message: string;
  compositeSignatures: compositeSignature[];
}

export interface IModifyMetadataOptions {
  content?: string;
  startDate?: moment.Moment;
  endDate?: moment.Moment;
  source?: string;
}

export enum userValidActivityTypeEnum {
  'Interact',
  'Form',
  'Vote',
  'Test',
  'Node',
  'Learn',
  'Create',
  'Develop',
  'Whitelist',
  'IXO',
  'LuckDraw',
  'Register',
  'Airdrop',
  'Mint',
  'Claim',
  'Meeting',
  'Other',
}

export interface IGetActivitiesResponse extends IResponse {
  data: Activity[];
  total: number;
}

export interface IGetActivityResponse extends IResponse {
  data: Activity | null;
}

export interface ICloseOptionsFromTask {
  id: number;
}

export interface IRecommendActivity {
  id: number;
  title: string;
  content: string | '';
  source: string | '';
  startDate: Date;
  endDate: Date | null;
  categories: CategoriesOnActivities[];
  voteResult: Vote[];
}

export interface IActivityToDiscord {
  id: number;
  title: string;
  content: string;
  source: string;
  link: string;
  startDate: string;
  endDate: string;
  categories: string[];
}

export const categories = [
  {
    id: 0,
    type: 'All',
    comment: 'All typeof activities',
  },
  {
    id: 1,
    type: 'Interact',
    comment: 'Use product with no reward, for future airdrop',
  },
  {
    id: 2,
    type: 'Meeting',
    comment: 'Join community call to get poap/role/reward',
  },
  { id: 3, type: 'Vote', comment: 'voting for governance' },
  { id: 4, type: 'Claim', comment: 'Claim airdrop' },
  { id: 5, type: 'Whitelist', comment: 'join whitelist' },
  { id: 6, type: 'Mint', comment: 'Mint NFT' },
  { id: 7, type: 'Create', comment: 'create media, meme, aircle...' },
  { id: 8, type: 'LuckDraw', comment: 'join luckdraw' },
  { id: 9, type: 'Learn', comment: 'learn to earn' },
  { id: 10, type: 'Node', comment: "run testnet node'" },
  { id: 11, type: 'Test', comment: 'test product and report bug' },
  { id: 12, type: 'Develop', comment: 'develop a product or module' },
  {
    id: 13,
    type: 'Register',
    comment:
      'register join Discord,join telegram,create account,subcribe email,signUp website...',
  },
  { id: 14, type: 'Form', comment: 'do some task and fill form' },
  { id: 15, type: 'IXO', comment: 'join inital offerings' },
  { id: 16, type: 'Other', comment: 'Other activity not in category' },
  {
    id: 17,
    type: 'Airdrop',
    comment: 'only use for activity/create_airdrop, not confuse with other',
  },
];

export const getCategoriesNameList = (
  categoriesForDB: CategoriesOnActivities[],
): string[] => {
  return categoriesForDB.map((category) => {
    const categoryFind = categories.find(
      (detail) => detail.id === category.categoryId,
    );
    if (categoryFind !== undefined) {
      return categoryFind.type;
    }
  });
};
