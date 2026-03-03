import { UserRepository } from '@/lib/repositories/user.repository'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const userRepository = new UserRepository()

export class UserService {
  async getUserProfile(userId: string) {
    const user = await userRepository.findById(userId)
    if (!user) throw new Error('User not found')

    const stats = await userRepository.getUserStats(userId)

    const currentProgress = await prisma.userLevelProgress.findUnique({
      where: {
        userId_level: {
          userId,
          level: user.currentLevel,
        },
      },
    })

    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      currentLevel: user.currentLevel,
      vipStatus: user.vipStatus,
      createdAt: user.createdAt,
      stats,
      currentProgress: {
        level: user.currentLevel,
        completedCount: currentProgress?.completedCount || 0,
        masteredCount: currentProgress?.masteredCount || 0,
        totalSentences: 20,
      },
    }
  }

  async updateUserProfile(
    userId: string,
    data: {
      nickname?: string
      avatarUrl?: string
    }
  ) {
    const updated = await userRepository.update(userId, data)
    return this.getUserProfile(updated.id)
  }

  async getUserRanking(userId: string) {
    const user = await userRepository.findById(userId)
    if (!user) throw new Error('User not found')

    const higherRank = await prisma.user.count({
      where: {
        currentLevel: { gt: user.currentLevel },
      },
    })

    const sameLevel = await prisma.user.count({
      where: {
        currentLevel: user.currentLevel,
      },
    })

    return {
      userId,
      currentLevel: user.currentLevel,
      rank: higherRank + 1,
      totalUsers: await prisma.user.count(),
      sameLevelUsers: sameLevel,
    }
  }
}
