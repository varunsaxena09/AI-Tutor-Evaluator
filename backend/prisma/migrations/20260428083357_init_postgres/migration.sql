-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('SELECTED', 'NEEDS_IMPROVEMENT', 'REJECTED', 'PENDING');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CANDIDATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "maxDifficultyReached" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "transcript" TEXT,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correctness" TEXT,
    "score" DOUBLE PRECISION,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationMetrics" (
    "id" SERIAL NOT NULL,
    "answerId" INTEGER NOT NULL,
    "fillerCount" INTEGER NOT NULL DEFAULT 0,
    "fillerDensity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pauseCount" INTEGER NOT NULL DEFAULT 0,
    "avgPauseDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speakingPace" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vocabularyRichness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "CommunicationMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clarityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "communicationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "warmthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "simplicityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "patienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fluencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFillerWords" INTEGER NOT NULL DEFAULT 0,
    "totalPauses" INTEGER NOT NULL DEFAULT 0,
    "speakingPace" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vocabularyRichness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "detailedFeedback" TEXT,
    "recommendation" "Status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationMetrics_answerId_key" ON "CommunicationMetrics"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_sessionId_key" ON "Evaluation"("sessionId");

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMetrics" ADD CONSTRAINT "CommunicationMetrics_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
