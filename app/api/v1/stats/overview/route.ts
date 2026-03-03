import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/v1/stats/overview
 * 获取系统概览统计
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

    // 获取总用户数
    const totalUsers = await prisma.user.count()

    // 获取今日新增用户
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: { gte: today },
      },
    })

    // 获取活跃用户数（今日有学习记录）
    const activeUsersToday = await prisma.userSentenceMastery.findMany({
      where: {
        lastPracticedAt: { gte: today },
      },
      distinct: ['userId'],
      select: { userId: true },
    })

    // 获取总学习句子数
    const totalSentencesPracticed = await prisma.userSentenceMastery.count()

    // 获取已完成等级数
    const completedLevels = await prisma.userLevelProgress.count({
      where: { isPassed: true },
    })

    // 获取平均等级
    const avgLevel = await prisma.user.aggregate({
      _avg: { currentLevel: true },
    })

    // 获取最高等级
    const maxLevel = await prisma.user.aggregate({
      _max: { currentLevel: true },
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        totalUsers,
        newUsersToday,
        activeUsersToday: activeUsersToday.length,
        totalSentencesPracticed,
        completedLevels,
        averageLevel: Math.round((avgLevel._avg.currentLevel || 0) * 100) / 100,
        maxLevel: maxLevel._max.currentLevel || 0,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Get overview stats error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
