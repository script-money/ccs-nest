import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UFIX64_PRECISION = 8;
// UFix64 values shall be always passed as strings
export const toUFix64 = (value) => value.toFixed(UFIX64_PRECISION);

export default prisma;
