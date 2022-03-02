import { IsNumberString, IsOptional } from 'class-validator';
import { Address } from '../interface/flow';
import { IsFlowAddress } from './custom';

export class MemorialsGetDTO {
  @IsNumberString()
  @IsOptional()
  activityId?: number;

  @IsFlowAddress()
  @IsOptional()
  userAddress?: Address;
}
