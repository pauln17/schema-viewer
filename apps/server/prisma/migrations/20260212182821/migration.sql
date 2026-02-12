-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('VIEWER', 'EDITOR');

-- CreateEnum
CREATE TYPE "ConstraintType" AS ENUM ('PRIMARY_KEY', 'FOREIGN_KEY', 'DEFAULT', 'UNIQUE', 'CHECK', 'NOT_NULL');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema-collaboration" (
    "id" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'VIEWER',

    CONSTRAINT "schema-collaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema-table" (
    "id" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,

    CONSTRAINT "schema-table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table-column" (
    "id" TEXT NOT NULL,
    "schemaTableId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "table-column_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "column-relation" (
    "id" TEXT NOT NULL,
    "sourceColumnId" TEXT NOT NULL,
    "targetColumnId" TEXT NOT NULL,
    "onDelete" TEXT,
    "onUpdate" TEXT,

    CONSTRAINT "column-relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table-index" (
    "id" TEXT NOT NULL,
    "schemaTableId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "indexedColumnIds" TEXT[],

    CONSTRAINT "table-index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table-column-constraint" (
    "id" TEXT NOT NULL,
    "schemaTableId" TEXT NOT NULL,
    "tableColumnId" TEXT,
    "name" TEXT NOT NULL,
    "type" "ConstraintType" NOT NULL,
    "expression" TEXT,

    CONSTRAINT "table-column-constraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "schema_userId_idx" ON "schema"("userId");

-- CreateIndex
CREATE INDEX "schema-collaboration_collaboratorId_idx" ON "schema-collaboration"("collaboratorId");

-- CreateIndex
CREATE UNIQUE INDEX "schema-collaboration_schemaId_collaboratorId_key" ON "schema-collaboration"("schemaId", "collaboratorId");

-- CreateIndex
CREATE INDEX "schema-table_schemaId_idx" ON "schema-table"("schemaId");

-- CreateIndex
CREATE INDEX "table-column_schemaTableId_idx" ON "table-column"("schemaTableId");

-- CreateIndex
CREATE INDEX "column-relation_sourceColumnId_idx" ON "column-relation"("sourceColumnId");

-- CreateIndex
CREATE INDEX "column-relation_targetColumnId_idx" ON "column-relation"("targetColumnId");

-- CreateIndex
CREATE INDEX "table-index_schemaTableId_idx" ON "table-index"("schemaTableId");

-- CreateIndex
CREATE INDEX "table-column-constraint_schemaTableId_idx" ON "table-column-constraint"("schemaTableId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- AddForeignKey
ALTER TABLE "schema" ADD CONSTRAINT "schema_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema-collaboration" ADD CONSTRAINT "schema-collaboration_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "schema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema-collaboration" ADD CONSTRAINT "schema-collaboration_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema-table" ADD CONSTRAINT "schema-table_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "schema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table-column" ADD CONSTRAINT "table-column_schemaTableId_fkey" FOREIGN KEY ("schemaTableId") REFERENCES "schema-table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "column-relation" ADD CONSTRAINT "column-relation_sourceColumnId_fkey" FOREIGN KEY ("sourceColumnId") REFERENCES "table-column"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "column-relation" ADD CONSTRAINT "column-relation_targetColumnId_fkey" FOREIGN KEY ("targetColumnId") REFERENCES "table-column"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table-index" ADD CONSTRAINT "table-index_schemaTableId_fkey" FOREIGN KEY ("schemaTableId") REFERENCES "schema-table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table-column-constraint" ADD CONSTRAINT "table-column-constraint_schemaTableId_fkey" FOREIGN KEY ("schemaTableId") REFERENCES "schema-table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table-column-constraint" ADD CONSTRAINT "table-column-constraint_tableColumnId_fkey" FOREIGN KEY ("tableColumnId") REFERENCES "table-column"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
