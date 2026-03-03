import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/v1/admin/dashboard/learning
 * 获取学习统计数据
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

    // 获取最近N天的学习数据
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const practices = await prisma.userSentenceMastery.findMany({
      where: { lastPracticedAt: { gte: startDate } },
      select: { lastPracticedAt: true },
    })

    // 按日期分组
    const practiceTrendMap = new Map<string, number>()

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      practiceTrendMap.set(dateStr, 0)
    }

    practices.forEach((practice) => {
      if (practice.lastPracticedAt) {
        const dateStr = practice.lastPracticedAt.toISOString().split('T')[0]
        practiceTrendMap.set(dateStr, (practiceTrendMap.get(dateStr) || 0) + 1)
      }
    })

    const practiceTrend = Array.from(practiceTrendMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({ date, count }))

    // 获取掌握度分布
    const masteryDistribution = await prisma.userSentenceMastery.groupBy({
      by: ['masteryScore'],
      _count: true,
    })

    // 统计掌握度等级
    const masteryStats = {
      notMastered: masteryDistribution.find((m) => m.masteryScore === 0)?._count || 0,
      partiallyMastered: masteryDistribution.find((m) => m.masteryScore === 50)?._count || 0,
      fullyMastered: masteryDistribution.find((m) => m.masteryScore === 100)?._count || 0,
    }

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        trend: practiceTrend,
        masteryStats,
        totalPracticed: practices.length,
        averagePerDay: Math.round((practices.length / days) * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Get learning stats error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
