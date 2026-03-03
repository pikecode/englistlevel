import { PrismaClient } from '@prisma/client'
import { generateToken } from '@/lib/utils/jwt'

const prisma = new PrismaClient()

export interface WxLoginRequest {
  code: string
}

export interface WxLoginResponse {
  token: string
  userId: string
  isNewUser: boolean
  user: {
    nickname?: string
    avatarUrl?: string
    currentLevel: number
  }
}

export async function wxLogin(req: WxLoginRequest): Promise<WxLoginResponse> {
  const { code } = req

  if (!code) {
    throw new Error('Code is required')
  }

  // Mock openid for development
  const openid = `mock-openid-${code.slice(-6)}`

  let user = await prisma.user.findUnique({
    where: { openid },
  })

  const isNewUser = !user

  if (!user) {
    user = await prisma.user.create({
      data: {
        openid,
        nickname: `User-${openid.slice(-6)}`,
        currentLevel: 1,
      },
    })

    await prisma.userLevelProgress.create({
      data: {
        userId: user.id,
        level: 1,
        totalSentences: 20,
        completedCount: 0,
        masteredCount: 0,
      },
    })
  }

  const token = generateToken({
    userId: user.id,
    openid: user.openid,
  })

  return {
    token,
    userId: user.id,
    isNewUser,
    user: {
      nickname: user.nickname || undefined,
      avatarUrl: user.avatarUrl || undefined,
      currentLevel: user.currentLevel,
    },
  }
}

export async function getUserInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      openid: true,
      nickname: true,
      avatarUrl: true,
      currentLevel: true,
      vipStatus: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}
