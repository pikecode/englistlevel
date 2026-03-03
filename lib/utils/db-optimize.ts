import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 数据库查询优化工具
 */

/**
 * 获取用户及其关联数据（优化查询）
 */
export async function getUserWithStats(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      openid: true,
      nickname: true,
      avatarUrl: true,
      currentLevel: true,
      vipStatus: true,
      createdAt: true,
      _count: {
        select: {
          levelProgress: true,
          sentenceMastery: true,
        },
      },
    },
  })
}

/**
 * 批量获取用户排行榜（优化查询）
 */
export async function getTopUsers(limit: number = 100) {
  return prisma.user.findMany({
    orderBy: { currentLevel: 'desc' },
    take: limit,
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      currentLevel: true,
      _count: {
        select: {
          levelProgress: {
            where: { isPassed: true },
          },
        },
      },
    },
  })
}

/**
 * 获取学习统计（优化查询）
 */
export async function getLearningStats(userId: string) {
  const [completedLevels, masteredSentences, totalPracticed] = await Promise.all([
    prisma.userLevelProgress.count({
      where: { userId, isPassed: true },
    }),
    prisma.userSentenceMastery.count({
      where: { userId, masteryScore: { gte: 80 } },
    }),
    prisma.userSentenceMastery.count({
      where: { userId },
    }),
  ])

  return {
    completedLevels,
    masteredSentences,
    totalPracticed,
  }
}

/**
 * 获取等级内容（优化查询）
 */
export async function getLevelContent(level: number) {
  return prisma.sentence.findMany({
    where: { level, status: 'active' },
    orderBy: { seqNo: 'asc' },
    select: {
      id: true,
      enText: true,
      zhText: true,
      audioUrl: true,
      seqNo: true,
    },
  })
}
