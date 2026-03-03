-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "openid" TEXT NOT NULL,
    "unionid" TEXT,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "vipStatus" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLevelProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "totalSentences" INTEGER NOT NULL DEFAULT 20,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "masteredCount" INTEGER NOT NULL DEFAULT 0,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "passedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLevelProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSentenceMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "masteryScore" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSentenceMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sentence" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "seqNo" INTEGER NOT NULL,
    "enText" TEXT NOT NULL,
    "zhText" TEXT NOT NULL,
    "audioUrl" TEXT,
    "ttsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 20,
    "correctCount" INTEGER NOT NULL,
    "suggestedLevel" INTEGER NOT NULL,
    "confirmedLevel" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerReview" (
    "id" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleCode" TEXT NOT NULL DEFAULT 'operator',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_openid_key" ON "User"("openid");

-- CreateIndex
CREATE INDEX "User_openid_idx" ON "User"("openid");

-- CreateIndex
CREATE INDEX "User_currentLevel_idx" ON "User"("currentLevel");

-- CreateIndex
CREATE INDEX "UserLevelProgress_userId_idx" ON "UserLevelProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLevelProgress_userId_level_key" ON "UserLevelProgress"("userId", "level");

-- CreateIndex
CREATE INDEX "UserSentenceMastery_userId_idx" ON "UserSentenceMastery"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSentenceMastery_userId_sentenceId_key" ON "UserSentenceMastery"("userId", "sentenceId");

-- CreateIndex
CREATE INDEX "Sentence_level_idx" ON "Sentence"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Sentence_level_seqNo_key" ON "Sentence"("level", "seqNo");

-- CreateIndex
CREATE INDEX "Assessment_userId_idx" ON "Assessment"("userId");

-- CreateIndex
CREATE INDEX "PeerReview_reviewerUserId_idx" ON "PeerReview"("reviewerUserId");

-- CreateIndex
CREATE INDEX "PeerReview_sentenceId_idx" ON "PeerReview"("sentenceId");

-- CreateIndex
CREATE UNIQUE INDEX "PeerReview_reviewerUserId_sentenceId_key" ON "PeerReview"("reviewerUserId", "sentenceId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "AdminUser_username_idx" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "OperationLog_adminUserId_idx" ON "OperationLog"("adminUserId");

-- CreateIndex
CREATE INDEX "OperationLog_module_idx" ON "OperationLog"("module");

-- CreateIndex
CREATE INDEX "OperationLog_createdAt_idx" ON "OperationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserLevelProgress" ADD CONSTRAINT "UserLevelProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSentenceMastery" ADD CONSTRAINT "UserSentenceMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSentenceMastery" ADD CONSTRAINT "UserSentenceMastery_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerReview" ADD CONSTRAINT "PeerReview_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerReview" ADD CONSTRAINT "PeerReview_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationLog" ADD CONSTRAINT "OperationLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
