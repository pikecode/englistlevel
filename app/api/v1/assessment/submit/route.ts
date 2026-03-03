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

    const body = await request.json()
    const { answers } = body

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { code: 40001, message: 'Invalid answers format', data: null },
        { status: 400 }
      )
    }

    const result = await assessmentService.submitAssessment(
      payload.userId,
      answers
    )

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: result,
    })
  } catch (error: any) {
    console.error('Submit assessment error:', error)

    if (error.message.includes('Expected')) {
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
