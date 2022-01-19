import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.category.createMany({
      data: [
        { type: 'Interact' },
        { type: 'Form' },
        { type: 'Vote' },
        { type: 'Test' },
        { type: 'Node' },
        { type: 'Learn' },
        { type: 'Create' },
        { type: 'Develop' },
        { type: 'Whitelist' },
        { type: 'IXO' },
        { type: 'LuckDraw' },
        { type: 'Register' },
        { type: 'Airdrop' },
        { type: 'Mint' },
        { type: 'Claim' },
        { type: 'Meeting' },
        { type: 'Other' },
      ],
    });
    await prisma.economicFactor.create({
      data: {},
    });
  } catch (error) {
    console.log('initiate data is already in db, skip seed');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
