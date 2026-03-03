import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { AssessmentService } from '@/lib/services/assessment.service'

const assessmentService = new AssessmentService()

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

    const shouldTake = await assessmentService.shouldUserTakeAssessment(
      payload.userId
    )

    if (!shouldTake) {
      return NextResponse.json(
        {
          code: 40001,
          message: 'User does not need to take assessment',
          data: null,
        },
        { status: 400 }
      )
    }

    const questions = await assessmentService.generateAssessmentQuestions()

    const assessmentId = `assessment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        assessmentId,
        questions: questions.map((q) => ({
          id: q.id,
          enText: q.enText,
          zhText: q.zhText,
          audioUrl: q.audioUrl,
          options: q.options,
        })),
        questionCount: questions.length,
      },
    })
  } catch (error) {
    console.error('Start assessment error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
