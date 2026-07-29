-- CreateTable
CREATE TABLE "phonetic_clusters" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "pronunciationNote" TEXT,
    "phoneticPinyin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phonetic_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phonetic_cluster_members" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,

    CONSTRAINT "phonetic_cluster_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phonetic_clusters_componentId_key" ON "phonetic_clusters"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "phonetic_cluster_members_clusterId_characterId_key" ON "phonetic_cluster_members"("clusterId", "characterId");

-- AddForeignKey
ALTER TABLE "phonetic_clusters" ADD CONSTRAINT "phonetic_clusters_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phonetic_cluster_members" ADD CONSTRAINT "phonetic_cluster_members_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "phonetic_clusters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phonetic_cluster_members" ADD CONSTRAINT "phonetic_cluster_members_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("glyph") ON DELETE RESTRICT ON UPDATE CASCADE;
