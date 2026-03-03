import { NextRequest, NextResponse } from 'next/server'
import { wxLogin } from '@/lib/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        {
          code: 40001,
          message: 'Code is required',
          data: null,
        },
        { status: 400 }
      )
    }

    const result = await wxLogin({ code })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: result,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      {
        code: 50000,
        message: 'Internal server error',
        data: null,
      },
      { status: 500 }
    )
  }
}
