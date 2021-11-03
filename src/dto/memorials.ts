import { IsNumberString, IsOptional } from 'class-validator';
import { Address } from '../interface/flow';

export class MemorialsGetDTO {
  @IsNumberString()
  @IsOptional()
  activityId?: number;

  @IsOptional()
  userAddress?: Address;
}
