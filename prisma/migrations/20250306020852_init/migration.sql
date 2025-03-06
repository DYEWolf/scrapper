-- CreateTable
CREATE TABLE "Property" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_sourceUrl_key" ON "Property"("sourceUrl");

-- CreateIndex
CREATE INDEX "Property_sourceUrl_idx" ON "Property"("sourceUrl");
