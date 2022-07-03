-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "offlineRole" TEXT,
ADD COLUMN     "onlineMessage" TEXT,
ALTER COLUMN "musicChannel" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roles" TEXT[];

-- CreateTable
CREATE TABLE "RedditPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isOver18" BOOLEAN NOT NULL,
    "url" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "text" TEXT,
    "author" TEXT NOT NULL,

    CONSTRAINT "RedditPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedditMedia" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "awsKey" TEXT NOT NULL,
    "redditPostId" TEXT NOT NULL,

    CONSTRAINT "RedditMedia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RedditMedia" ADD CONSTRAINT "RedditMedia_redditPostId_fkey" FOREIGN KEY ("redditPostId") REFERENCES "RedditPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
