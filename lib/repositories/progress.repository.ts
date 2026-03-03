import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class ProgressRepository {
  async getLevelProgress(userId: string, level: number) {
    return prisma.userLevelProgress.findUnique({
      where: {
        userId_level: {
          userId,
          level,
        },
      },
    })
  }

  async createLevelProgress(userId: string, level: number) {
    return prisma.userLevelProgress.create({
      data: {
        userId,
        level,
        totalSentences: 20,
        completedCount: 0,
        masteredCount: 0,
      },
    })
  }

  async updateSentenceMastery(
    userId: string,
    sentenceId: string,
    masteryScore: number
  ) {
    return prisma.userSentenceMastery.upsert({
      where: {
        userId_sentenceId: {
          userId,
          sentenceId,
        },
      },
      update: {
        masteryScore,
        lastPracticedAt: new Date(),
      },
      create: {
        userId,
        sentenceId,
        masteryScore,
        lastPracticedAt: new Date(),
      },
    })
  }

  async getLevelMasteryStats(userId: string, level: number) {
    const masteries = await prisma.userSentenceMastery.findMany({
      where: {
        userId,
        sentence: {
          level,
        },
      },
      select: {
        masteryScore: true,
      },
    })

    const completedCount = masteries.filter((m) => m.masteryScore > 0).length
    const masteredCount = masteries.filter((m) => m.masteryScore >= 80).length

    return {
      completedCount,
      masteredCount,
      totalCount: 20,
    }
  }

  async markLevelAsPassed(userId: string, level: number) {
    return prisma.userLevelProgress.update({
      where: {
        userId_level: {
          userId,
          level,
        },
      },
      data: {
        isPassed: true,
        passedAt: new Date(),
      },
    })
  }

  async updateLevelProgress(
    userId: string,
    level: number,
    data: {
      completedCount?: number
      masteredCount?: number
    }
  ) {
    return prisma.userLevelProgress.update({
      where: {
        userId_level: {
          userId,
          level,
        },
      },
      data,
    })
  }
}
