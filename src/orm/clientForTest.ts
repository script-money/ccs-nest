import { PrismaClient } from '@prisma/client';
import * as config from '../config/dapp-config.json';

const prisma = new PrismaClient();

export const ADMIN = config.accounts[0];
export const USER1 = config.accounts[1];
export const USER2 = config.accounts[2];
export const USER3 = config.accounts[3];
export const USER4 = config.accounts[4];

const UFIX64_PRECISION = 8;
// UFix64 values shall be always passed as strings
export const toUFix64 = (value) => value.toFixed(UFIX64_PRECISION);

export default prisma;
