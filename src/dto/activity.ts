import { userValidActivityTypeEnum } from '../interface/activity';
import { Address } from '../interface/flow';
import { ActivityType } from '@prisma/client';
import { IsNumberString, IsOptional, ValidateIf } from 'class-validator';
import { ToBoolean } from './transfer';

export class ActivitiesGetDTO {
  @IsNumberString()
  @IsOptional()
  limit?: number;

  @IsNumberString()
  @IsOptional()
  offset?: number;

  @ValidateIf(
    (o) =>
      o in
      Object.keys(userValidActivityTypeEnum).filter(
        (value) => typeof value === 'string',
      ),
  )
  @IsOptional()
  type?: ActivityType;

  @IsOptional()
  @ToBoolean()
  canVote?: boolean;

  @IsOptional()
  address?: Address;

  @IsOptional()
  @ToBoolean()
  canJoin?: boolean;

  @IsOptional()
  createBy?: string;
}
