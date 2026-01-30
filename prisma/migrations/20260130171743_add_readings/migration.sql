-- CreateTable
CREATE TABLE "Reading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "aiRelevance" TEXT,
    "aiChapters" TEXT,
    "aiTags" TEXT,
    "aiAngle" TEXT,
    "userNote" TEXT,
    "userTags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inbox',
    "usedInContentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "acceptedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Reading_url_key" ON "Reading"("url");
