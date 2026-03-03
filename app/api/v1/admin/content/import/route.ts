import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/v1/admin/content/sentences/import
 * 批量导入句子
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
    const { sentences } = body

    if (!Array.isArray(sentences) || sentences.length === 0) {
      return NextResponse.json(
        { code: 40001, message: 'Invalid sentences format', data: null },
        { status: 400 }
      )
    }

    // 批量创建句子
    const result = await prisma.sentence.createMany({
      data: sentences.map((s: any) => ({
        level: s.level,
        seqNo: s.seqNo,
        enText: s.enText,
        zhText: s.zhText,
        audioUrl: s.audioUrl,
        status: 'active',
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        imported: result.count,
        total: sentences.length,
      },
    })
  } catch (error) {
    console.error('Import sentences error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
