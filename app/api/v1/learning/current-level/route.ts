import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { LearningService } from '@/lib/services/learning.service'

const learningService = new LearningService()

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

    const content = await learningService.getCurrentLevelContent(payload.userId)

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: content,
    })
  } catch (error) {
    console.error('Get current level error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
