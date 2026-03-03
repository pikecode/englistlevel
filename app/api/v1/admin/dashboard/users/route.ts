import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/v1/admin/dashboard/users
 * 获取用户统计数据
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

    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 30)

    // 获取最近N天的新增用户
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    })

    // 按日期分组
    const userTrendMap = new Map<string, number>()

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      userTrendMap.set(dateStr, 0)
    }

    users.forEach((user) => {
      const dateStr = user.createdAt.toISOString().split('T')[0]
      userTrendMap.set(dateStr, (userTrendMap.get(dateStr) || 0) + 1)
    })

    const userTrend = Array.from(userTrendMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({ date, count }))

    // 获取等级分布
    const levelDistribution = await prisma.user.groupBy({
      by: ['currentLevel'],
      _count: true,
      orderBy: { currentLevel: 'asc' },
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        trend: userTrend,
        levelDistribution: levelDistribution.map((item) => ({
          level: item.currentLevel,
          count: item._count,
        })),
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
