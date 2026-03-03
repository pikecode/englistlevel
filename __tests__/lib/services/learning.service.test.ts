import { LearningService } from '@/lib/services/learning.service'

var mockSentenceRepo: {
  getSentencesByLevel: jest.Mock
  getSentenceById: jest.Mock
}

var mockProgressRepo: {
  getLevelProgress: jest.Mock
  createLevelProgress: jest.Mock
  updateSentenceMastery: jest.Mock
  getLevelMasteryStats: jest.Mock
  updateLevelProgress: jest.Mock
}

var mockUserRepo: {
  findById: jest.Mock
  upgradeLevel: jest.Mock
}

jest.mock('@/lib/repositories/sentence.repository', () => {
  mockSentenceRepo = {
    getSentencesByLevel: jest.fn(),
    getSentenceById: jest.fn(),
  }

  return {
    SentenceRepository: jest.fn(() => mockSentenceRepo),
  }
})

jest.mock('@/lib/repositories/progress.repository', () => {
  mockProgressRepo = {
    getLevelProgress: jest.fn(),
    createLevelProgress: jest.fn(),
    updateSentenceMastery: jest.fn(),
    getLevelMasteryStats: jest.fn(),
    updateLevelProgress: jest.fn(),
  }

  return {
    ProgressRepository: jest.fn(() => mockProgressRepo),
  }
})

jest.mock('@/lib/repositories/user.repository', () => {
  mockUserRepo = {
    findById: jest.fn(),
    upgradeLevel: jest.fn(),
  }

  return {
    UserRepository: jest.fn(() => mockUserRepo),
  }
})

describe('LearningService', () => {
  let service: LearningService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new LearningService()
  })

  it('should get current level content', async () => {
    const mockUser = { id: 'user-123', currentLevel: 1 }
    const mockSentences = [
      { id: 'sent-1', enText: 'Hello', zhText: '你好', seqNo: 1 },
      { id: 'sent-2', enText: 'Goodbye', zhText: '再见', seqNo: 2 },
    ]
    const mockProgress = { completedCount: 0, masteredCount: 0 }

    mockUserRepo.findById.mockResolvedValue(mockUser)
    mockSentenceRepo.getSentencesByLevel.mockResolvedValue(mockSentences)
    mockProgressRepo.getLevelProgress.mockResolvedValue(mockProgress)

    const content = await service.getCurrentLevelContent('user-123')

    expect(content.level).toBe(1)
    expect(content.sentences.length).toBe(2)
  })

  it('should record sentence progress', async () => {
    const mockSentence = { id: 'sent-1', level: 1 }
    const mockStats = { completedCount: 1, masteredCount: 0, totalCount: 20 }

    mockSentenceRepo.getSentenceById.mockResolvedValue(mockSentence)
    mockProgressRepo.getLevelMasteryStats.mockResolvedValue(mockStats)

    const result = await service.recordSentenceProgress('user-123', 'sent-1', 85)

    expect(result.masteryScore).toBe(85)
    expect(result.levelStats.completedCount).toBe(1)
  })

  it('should throw error for invalid mastery score', async () => {
    await expect(
      service.recordSentenceProgress('user-123', 'sent-1', 150)
    ).rejects.toThrow('Mastery score must be between 0 and 100')
  })
})
