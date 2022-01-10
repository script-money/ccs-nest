import { IAddUserFromEvent, IUpdateUserFromDiscord } from '../interface/user';
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

/**
 * update user info from discord
 * @param discordData {address: string, id: string, username: string, avatar: string, discriminator: string}
 * @returns user updated
 */
export const updateUser = async (discordData: IUpdateUserFromDiscord) => {
  return await prisma.user.update({
    where: {
      address: discordData.address,
    },
    data: {
      name: discordData.username,
      discord: discordData.username + '#' + discordData.discriminator,
      avatar: `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}`,
    },
  });
};
