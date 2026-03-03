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

    const body = await request.json()
    const { sentenceId, masteryScore } = body

    if (!sentenceId || masteryScore === undefined) {
      return NextResponse.json(
        { code: 40001, message: 'Missing required fields', data: null },
        { status: 400 }
      )
    }

    const result = await learningService.recordSentenceProgress(
      payload.userId,
      sentenceId,
      masteryScore
    )

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: result,
    })
  } catch (error) {
    console.error('Record progress error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
