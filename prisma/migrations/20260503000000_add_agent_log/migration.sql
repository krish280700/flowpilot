-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "AgentLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "agentRole" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'PENDING',
    "input" TEXT,
    "output" TEXT,
    "score" DOUBLE PRECISION,
    "durationMs" INTEGER,
    "tokensUsed" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AgentLog" ADD CONSTRAINT "AgentLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
