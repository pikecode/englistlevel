import { NextRequest, NextResponse } from 'next/server'
import { adminLogin } from '@/lib/services/admin.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        {
          code: 40001,
          message: 'Username and password are required',
          data: null,
        },
        { status: 400 }
      )
    }

    const result = await adminLogin({ username, password })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: result,
    })
  } catch (error: any) {
    console.error('Admin login error:', error)

    if (error.message.includes('Invalid')) {
      return NextResponse.json(
        {
          code: 40003,
          message: error.message,
          data: null,
        },
        { status: 401 }
      )
    }

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
