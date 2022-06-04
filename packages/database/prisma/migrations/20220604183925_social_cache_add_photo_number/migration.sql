/*
  Warnings:

  - Added the required column `photoNumber` to the `TweetMedia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TweetMedia" ADD COLUMN     "photoNumber" INTEGER NOT NULL;
