-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "permissionsId" TEXT NOT NULL,
    "lastSeen" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL,
    "tag" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    "hetznerId" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "database" TEXT NOT NULL,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "id" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "canCreateDB" BOOLEAN NOT NULL DEFAULT false,
    "maxDatabases" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_permissionsId_key" ON "User"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Server_channel_key" ON "Server"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "Server_hetznerId_key" ON "Server"("hetznerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
