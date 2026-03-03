import { UserRepository } from '@/lib/repositories/user.repository'

var mockPrisma: {
  user: {
    findUnique: jest.Mock
    findMany: jest.Mock
    create: jest.Mock
    update: jest.Mock
    count: jest.Mock
  }
  userLevelProgress: {
    count: jest.Mock
  }
  userSentenceMastery: {
    count: jest.Mock
  }
}

jest.mock('@prisma/client', () => {
  mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userLevelProgress: {
      count: jest.fn(),
    },
    userSentenceMastery: {
      count: jest.fn(),
    },
  }

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  }
})

describe('UserRepository', () => {
  let repository: UserRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new UserRepository()
  })

  it('should find user by id', async () => {
    const mockUser = {
      id: 'user-123',
      openid: 'openid-123',
      nickname: 'Test User',
      currentLevel: 5,
    }

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)

    const user = await repository.findById('user-123')

    expect(user).toEqual(mockUser)
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
    })
  })

  it('should create user', async () => {
    const mockUser = {
      id: 'user-123',
      openid: 'openid-123',
      nickname: 'New User',
      currentLevel: 1,
    }

    mockPrisma.user.create.mockResolvedValue(mockUser)

    const user = await repository.create({
      openid: 'openid-123',
      nickname: 'New User',
    })

    expect(user).toEqual(mockUser)
    expect(mockPrisma.user.create).toHaveBeenCalled()
  })

  it('should upgrade user level', async () => {
    const mockUser = {
      id: 'user-123',
      currentLevel: 5,
    }

    const updatedUser = {
      id: 'user-123',
      currentLevel: 6,
    }

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockPrisma.user.update.mockResolvedValue(updatedUser)

    const result = await repository.upgradeLevel('user-123')

    expect(result.currentLevel).toBe(6)
  })
})
