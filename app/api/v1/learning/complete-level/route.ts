import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { LearningService } from '@/lib/services/learning.service'

const learningService = new LearningService()

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

    const result = await learningService.completeLevelAndCheckUpgrade(
      payload.userId
    )

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: result,
    })
  } catch (error: any) {
    console.error('Complete level error:', error)

    if (error.message.includes('Cannot upgrade')) {
      return NextResponse.json(
        { code: 40001, message: error.message, data: null },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
