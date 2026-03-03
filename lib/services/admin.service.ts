import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import { generateToken } from '@/lib/utils/jwt'

const prisma = new PrismaClient()

export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminLoginResponse {
  token: string
  adminId: string
  username: string
  role: string
}

/**
 * 管理员登录
 */
export async function adminLogin(req: AdminLoginRequest): Promise<AdminLoginResponse> {
  const { username, password } = req

  if (!username || !password) {
    throw new Error('Username and password are required')
  }

  // 查询管理员
  const admin = await prisma.adminUser.findUnique({
    where: { username },
  })

  if (!admin) {
    throw new Error('Invalid username or password')
  }

  // 验证密码
  const isPasswordValid = await bcryptjs.compare(password, admin.passwordHash)

  if (!isPasswordValid) {
    throw new Error('Invalid username or password')
  }

  if (admin.status !== 'active') {
    throw new Error('Admin account is inactive')
  }

  // 更新最后登录时间
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  })

  // 生成 token
  const token = generateToken({
    userId: admin.id,
    openid: `admin-${admin.id}`,
  })

  return {
    token,
    adminId: admin.id,
    username: admin.username,
    role: admin.roleCode,
  }
}

/**
 * 创建管理员账户
 */
export async function createAdmin(data: {
  username: string
  password: string
  roleCode: string
}): Promise<any> {
  const { username, password, roleCode } = data

  // 检查用户名是否已存在
  const existing = await prisma.adminUser.findUnique({
    where: { username },
  })

  if (existing) {
    throw new Error('Username already exists')
  }

  // 加密密码
  const passwordHash = await bcryptjs.hash(password, 10)

  return prisma.adminUser.create({
    data: {
      username,
      passwordHash,
      roleCode,
      status: 'active',
    },
  })
}

/**
 * 验证管理员权限
 */
export async function verifyAdminPermission(adminId: string, requiredRole: string): Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
  })

  if (!admin || admin.status !== 'active') {
    return false
  }

  // 简单的权限检查（可根据需要扩展）
  if (requiredRole === 'admin' && admin.roleCode !== 'admin') {
    return false
  }

  return true
}
