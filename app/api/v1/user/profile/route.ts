import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { UserService } from '@/lib/services/user.service'

const userService = new UserService()

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json(
        {
          code: 40003,
          message: 'Unauthorized',
          data: null,
        },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        {
          code: 40003,
          message: 'Invalid token',
          data: null,
        },
        { status: 401 }
      )
    }

    const profile = await userService.getUserProfile(payload.userId)

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: profile,
    })
  } catch (error) {
    console.error('Get profile error:', error)
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

export async function PATCH(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json(
        {
          code: 40003,
          message: 'Unauthorized',
          data: null,
        },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        {
          code: 40003,
          message: 'Invalid token',
          data: null,
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nickname, avatarUrl } = body

    const updated = await userService.updateUserProfile(payload.userId, {
      nickname,
      avatarUrl,
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: updated,
    })
  } catch (error) {
    console.error('Update profile error:', error)
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
