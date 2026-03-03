import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/v1/ranking/level?level=1
 * 获取指定等级的排行榜
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
    const level = parseInt(searchParams.get('level') || '1')

    if (level < 1 || level > 100) {
      return NextResponse.json(
        { code: 40001, message: 'Invalid level', data: null },
        { status: 400 }
      )
    }

    // 获取该等级已完成的用户
    const usersAtLevel = await prisma.userLevelProgress.findMany({
      where: {
        level,
        isPassed: true,
      },
      orderBy: { passedAt: 'asc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            currentLevel: true,
          },
        },
      },
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        level,
        users: usersAtLevel.map((progress, index) => ({
          rank: index + 1,
          ...progress.user,
          completedAt: progress.passedAt,
        })),
        totalCompleted: await prisma.userLevelProgress.count({
          where: { level, isPassed: true },
        }),
      },
    })
  } catch (error) {
    console.error('Get level ranking error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
