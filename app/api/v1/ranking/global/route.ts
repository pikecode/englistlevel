import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/v1/ranking/global
 * 获取全局排行榜（前100名）
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

    // 获取前100名用户
    const topUsers = await prisma.user.findMany({
      orderBy: { currentLevel: 'desc' },
      take: 100,
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        currentLevel: true,
        createdAt: true,
      },
    })

    // 获取当前用户的排名
    const userRank = await prisma.user.count({
      where: {
        currentLevel: { gt: (await prisma.user.findUnique({ where: { id: payload.userId }, select: { currentLevel: true } }))?.currentLevel || 0 },
      },
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        topUsers: topUsers.map((user, index) => ({
          rank: index + 1,
          ...user,
        })),
        myRank: userRank + 1,
        totalUsers: await prisma.user.count(),
      },
    })
  } catch (error) {
    console.error('Get global ranking error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
