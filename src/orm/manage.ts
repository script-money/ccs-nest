import prisma from './clientForTest';

export const toggleMaintenance = async (isInMaintenance: boolean) => {
  return await prisma.serverStatus.updateMany({
    data: {
      maintenance: isInMaintenance,
    },
  });
};

// get maintenanace status
export const getMaintenanceStatus = async () => {
  return await prisma.serverStatus.findFirst();
};
