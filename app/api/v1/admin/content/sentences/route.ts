import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/v1/admin/content/sentences
 * 获取所有句子（分页）
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
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const level = searchParams.get('level')

    const skip = (page - 1) * pageSize

    const where: any = { status: 'active' }
    if (level) {
      where.level = parseInt(level)
    }

    const [sentences, total] = await Promise.all([
      prisma.sentence.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { level: 'asc' },
      }),
      prisma.sentence.count({ where }),
    ])

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        sentences,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('Get sentences error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/admin/content/sentences
 * 创建句子
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { level, seqNo, enText, zhText, audioUrl } = body

    if (!level || !seqNo || !enText || !zhText) {
      return NextResponse.json(
        { code: 40001, message: 'Missing required fields', data: null },
        { status: 400 }
      )
    }

    const sentence = await prisma.sentence.create({
      data: {
        level,
        seqNo,
        enText,
        zhText,
        audioUrl,
        status: 'active',
      },
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: sentence,
    })
  } catch (error: any) {
    console.error('Create sentence error:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { code: 40001, message: 'Sentence already exists', data: null },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
