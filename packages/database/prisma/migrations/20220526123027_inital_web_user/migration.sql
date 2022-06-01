-- CreateTable
CREATE TABLE "WebUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dcRefreshToken" TEXT NOT NULL,
    "dcAccessToken" TEXT NOT NULL,
    "dcAccessExpires" INTEGER NOT NULL,
    "dcId" TEXT NOT NULL,

    CONSTRAINT "WebUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "musicChannel" TEXT NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebUser_email_key" ON "WebUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WebUser_dcId_key" ON "WebUser"("dcId");
