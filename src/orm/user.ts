import { IAddUserFromEvent } from '../interface/user';
import prisma from './clientForTest';

/**
 * get user basic information
 * @param address user Flow address
 * @returns user
 */
export const getUser = async (address: string) => {
  return await prisma.user.findUnique({
    where: {
      address,
    },
  });
};

/**
 * add user to database
 * @param eventData {address: Address}
 * @returns user from db
 */
export const addUser = async (eventData: IAddUserFromEvent) => {
  return await prisma.user.create({
    data: {
      address: eventData.address,
    },
  });
};
