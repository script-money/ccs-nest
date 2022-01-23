-- CreateEnum
CREATE TYPE "TokenChangeType" AS ENUM ('BuyBallot', 'CreateActivity', 'RewardByActivity', 'Airdrop');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('Interact', 'Meeting', 'Vote', 'Claim', 'Whitelist', 'Mint', 'Create', 'LuckDraw', 'Learn', 'Node', 'Test', 'Develop', 'Register', 'Form', 'IXO', 'Other', 'Airdrop');

-- CreateTable
CREATE TABLE "BlockCursor" (
    "id" SERIAL NOT NULL,
    "eventName" TEXT NOT NULL,
    "currentHeight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "address" TEXT NOT NULL,
    "discord" TEXT,
    "avatar" TEXT,
    "flowns" TEXT,
    "name" TEXT,
    "votingPower" REAL NOT NULL DEFAULT 0.01,

    CONSTRAINT "User_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "metadata" JSONB NOT NULL,
    "creatorAddr" TEXT NOT NULL,
    "content" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "source" TEXT,
    "lockDate" TIMESTAMP(3),
    "upVote" INTEGER,
    "downVote" INTEGER,
    "closed" BOOLEAN NOT NULL,
    "consumed" BOOLEAN NOT NULL,
    "rewardToken" REAL,
    "absTotalPower" REAL,
    "bouns" REAL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "type" "ActivityType" NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriesOnActivities" (
    "activityId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "CategoriesOnActivities_pkey" PRIMARY KEY ("activityId","categoryId")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "voterAddr" TEXT NOT NULL,
    "isUpVote" BOOLEAN NOT NULL DEFAULT true,
    "power" REAL NOT NULL DEFAULT 1.0,
    "activityId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "EconomicFactor" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createConsumption" REAL NOT NULL DEFAULT 100.0,
    "maxRatio" REAL NOT NULL DEFAULT 5.0,
    "minRatio" REAL NOT NULL DEFAULT 1.0,
    "averageRatio" REAL NOT NULL DEFAULT 1.5,
    "asymmetry" REAL NOT NULL DEFAULT 2.0,
    "recentN" INTEGER NOT NULL DEFAULT 10,
    "ballotPrice" REAL NOT NULL DEFAULT 1.0,
    "ballotMinPrice" REAL NOT NULL DEFAULT 1.0,
    "recentAvgTotalPower" REAL NOT NULL DEFAULT 0.0,
    "bounsRatio" REAL NOT NULL DEFAULT 0.01,

    CONSTRAINT "EconomicFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memorial" (
    "ownerAddress" TEXT NOT NULL,
    "id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "seriesNumber" INTEGER NOT NULL,
    "circulatingCount" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "mintedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPositive" BOOLEAN NOT NULL,
    "bonus" REAL NOT NULL,

    CONSTRAINT "Memorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BallotBuyRecord" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "buyerAddress" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BallotBuyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenChangeRecord" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "TokenChangeType" NOT NULL,
    "amount" REAL NOT NULL,
    "userAddress" TEXT NOT NULL,
    "comment" TEXT,

    CONSTRAINT "TokenChangeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faucet" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT NOT NULL,

    CONSTRAINT "Faucet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User.address_unique" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Activity.id_unique" ON "Activity"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Category.type_unique" ON "Category"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Vote.voterAddr_activityId_unique" ON "Vote"("voterAddr", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_voterAddr_activityId_key" ON "Vote"("voterAddr", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "Memorial.id_unique" ON "Memorial"("id");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_creatorAddr_fkey" FOREIGN KEY ("creatorAddr") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnActivities" ADD CONSTRAINT "CategoriesOnActivities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnActivities" ADD CONSTRAINT "CategoriesOnActivities_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterAddr_fkey" FOREIGN KEY ("voterAddr") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memorial" ADD CONSTRAINT "Memorial_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memorial" ADD CONSTRAINT "Memorial_ownerAddress_fkey" FOREIGN KEY ("ownerAddress") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotBuyRecord" ADD CONSTRAINT "BallotBuyRecord_buyerAddress_fkey" FOREIGN KEY ("buyerAddress") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenChangeRecord" ADD CONSTRAINT "TokenChangeRecord_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("address") ON DELETE CASCADE ON UPDATE CASCADE;
