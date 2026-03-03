import { PrismaClient, User } from '@prisma/client'

const prisma = new PrismaClient()

export class UserRepository {
  async findById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    })
  }

  async findByOpenid(openid: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { openid },
    })
  }

  async create(data: {
    openid: string
    nickname?: string
    avatarUrl?: string
  }): Promise<User> {
    return prisma.user.create({
      data: {
        openid: data.openid,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl,
        currentLevel: 1,
      },
    })
  }

  async update(
    userId: string,
    data: {
      nickname?: string
      avatarUrl?: string
      currentLevel?: number
      vipStatus?: string
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data,
    })
  }

  async upgradeLevel(userId: string): Promise<User> {
    const user = await this.findById(userId)
    if (!user) throw new Error('User not found')

    const newLevel = Math.min(user.currentLevel + 1, 100)

    return prisma.user.update({
      where: { id: userId },
      data: { currentLevel: newLevel },
    })
  }

  async getUserStats(userId: string) {
    const user = await this.findById(userId)
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

    return {
      userId,
      currentLevel: user.currentLevel,
      completedLevels,
      masteredSentences,
      totalPracticed: await prisma.userSentenceMastery.count({
        where: { userId },
      }),
    }
  }
}
