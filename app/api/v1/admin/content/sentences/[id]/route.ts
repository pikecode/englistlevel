import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * PUT /api/v1/admin/content/sentences/[id]
 * 更新句子
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { enText, zhText, audioUrl } = body

    const sentence = await prisma.sentence.update({
      where: { id: params.id },
      data: {
        enText,
        zhText,
        audioUrl,
      },
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: sentence,
    })
  } catch (error: any) {
    console.error('Update sentence error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { code: 40001, message: 'Sentence not found', data: null },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/admin/content/sentences/[id]
 * 删除句子（软删除）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const sentence = await prisma.sentence.update({
      where: { id: params.id },
      data: { status: 'archived' },
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: sentence,
    })
  } catch (error: any) {
    console.error('Delete sentence error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { code: 40001, message: 'Sentence not found', data: null },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
