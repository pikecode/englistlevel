import { SentenceRepository } from '@/lib/repositories/sentence.repository'
import { ProgressRepository } from '@/lib/repositories/progress.repository'
import { UserRepository } from '@/lib/repositories/user.repository'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const sentenceRepo = new SentenceRepository()
const progressRepo = new ProgressRepository()
const userRepo = new UserRepository()

export class LearningService {
  async getCurrentLevelContent(userId: string) {
    const user = await userRepo.findById(userId)
    if (!user) throw new Error('User not found')

    const level = user.currentLevel

    const sentences = await sentenceRepo.getSentencesByLevel(level)

    if (sentences.length === 0) {
      throw new Error(`No sentences found for level ${level}`)
    }

    let progress = await progressRepo.getLevelProgress(userId, level)

    if (!progress) {
      progress = await progressRepo.createLevelProgress(userId, level)
    }

    return {
      level,
      sentences: sentences.map((s) => ({
        id: s.id,
        enText: s.enText,
        zhText: s.zhText,
        audioUrl: s.audioUrl,
        seqNo: s.seqNo,
      })),
      progress: {
        completedCount: progress.completedCount,
        masteredCount: progress.masteredCount,
        totalSentences: 20,
      },
    }
  }

  async recordSentenceProgress(
    userId: string,
    sentenceId: string,
    masteryScore: number
  ) {
    if (masteryScore < 0 || masteryScore > 100) {
      throw new Error('Mastery score must be between 0 and 100')
    }

    await progressRepo.updateSentenceMastery(userId, sentenceId, masteryScore)

    const sentence = await sentenceRepo.getSentenceById(sentenceId)
    if (!sentence) throw new Error('Sentence not found')

    const stats = await progressRepo.getLevelMasteryStats(
      userId,
      sentence.level
    )

    await progressRepo.updateLevelProgress(userId, sentence.level, {
      completedCount: stats.completedCount,
      masteredCount: stats.masteredCount,
    })

    return {
      sentenceId,
      masteryScore,
      levelStats: stats,
    }
  }

  async completeLevelAndCheckUpgrade(userId: string) {
    const user = await userRepo.findById(userId)
    if (!user) throw new Error('User not found')

    const currentLevel = user.currentLevel

    const progress = await progressRepo.getLevelProgress(userId, currentLevel)
    if (!progress) throw new Error('Progress not found')

    if (progress.completedCount < 20) {
      throw new Error(
        `Cannot upgrade: only ${progress.completedCount}/20 sentences completed`
      )
    }

    await progressRepo.markLevelAsPassed(userId, currentLevel)

    const newLevel = Math.min(currentLevel + 1, 100)
    const updatedUser = await userRepo.upgradeLevel(userId)

    if (newLevel <= 100) {
      await progressRepo.createLevelProgress(userId, newLevel)
    }

    return {
      oldLevel: currentLevel,
      newLevel: updatedUser.currentLevel,
      upgraded: newLevel > currentLevel,
      message:
        newLevel > currentLevel
          ? `Congratulations! You've reached level ${newLevel}!`
          : 'You have reached the maximum level!',
    }
  }

  async getLearningStats(userId: string) {
    const user = await userRepo.findById(userId)
    if (!user) throw new Error('User not found')

    const completedLevels = await prisma.userLevelProgress.count({
      where: {
        userId,
        isPassed: true,
      },
    })

    const masteredSentences = await prisma.userSentenceMastery.count({
      where: {
        userId,
        masteryScore: { gte: 80 },
      },
    })

    const totalPracticed = await prisma.userSentenceMastery.count({
      where: { userId },
    })

    return {
      currentLevel: user.currentLevel,
      completedLevels,
      masteredSentences,
      totalPracticed,
      progressPercentage: Math.round((completedLevels / 100) * 100),
    }
  }
}
