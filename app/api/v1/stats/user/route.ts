import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/v1/stats/user
 * 获取用户个人统计
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json(
        { code: 40003, message: 'Unauthorized', data: null },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { code: 40003, message: 'Invalid token', data: null },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return NextResponse.json(
        { code: 50000, message: 'User not found', data: null },
        { status: 500 }
      )
    }

    // 获取已完成的等级数
    const completedLevels = await prisma.userLevelProgress.count({
      where: { userId: payload.userId, isPassed: true },
    })

    // 获取已掌握的句子数
    const masteredSentences = await prisma.userSentenceMastery.count({
      where: { userId: payload.userId, masteryScore: { gte: 80 } },
    })

    // 获取总学习句子数
    const totalPracticed = await prisma.userSentenceMastery.count({
      where: { userId: payload.userId },
    })

    // 获取学习天数
    const firstPractice = await prisma.userSentenceMastery.findFirst({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })

    const learningDays = firstPractice
      ? Math.floor((Date.now() - firstPractice.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0

    // 获取今日学习句子数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayPracticed = await prisma.userSentenceMastery.count({
      where: {
        userId: payload.userId,
        lastPracticedAt: { gte: today },
      },
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        currentLevel: user.currentLevel,
        completedLevels,
        masteredSentences,
        totalPracticed,
        learningDays,
        todayPracticed,
        progressPercentage: Math.round((completedLevels / 100) * 100),
      },
    })
  } catch (error) {
    console.error('Get user stats error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
