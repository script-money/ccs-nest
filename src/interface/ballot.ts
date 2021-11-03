import { Address, UFix64, Int } from './flow';

export interface IBallotsBoughtFromEvent {
  amount: Int;
  buyer: Address;
  price: UFix64;
}
