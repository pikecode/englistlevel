import { LearningService } from '@/lib/services/learning.service'
import { SentenceRepository } from '@/lib/repositories/sentence.repository'
import { ProgressRepository } from '@/lib/repositories/progress.repository'
import { UserRepository } from '@/lib/repositories/user.repository'

// Mock repositories
jest.mock('@/lib/repositories/sentence.repository')
jest.mock('@/lib/repositories/progress.repository')
jest.mock('@/lib/repositories/user.repository')

describe('LearningService', () => {
  let service: LearningService
  let mockSentenceRepo: any
  let mockProgressRepo: any
  let mockUserRepo: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSentenceRepo = new SentenceRepository() as jest.Mocked<SentenceRepository>
    mockProgressRepo = new ProgressRepository() as jest.Mocked<ProgressRepository>
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>

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
