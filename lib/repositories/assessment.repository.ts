import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class AssessmentRepository {
  async createAssessment(data: {
    userId: string
    score: number
    questionCount: number
    correctCount: number
    suggestedLevel: number
    confirmedLevel: number
  }) {
    return prisma.assessment.create({
      data,
    })
  }

  async getUserAssessments(userId: string) {
    return prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  }

  async getLatestAssessment(userId: string) {
    return prisma.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async hasUserTakenAssessment(userId: string) {
    const count = await prisma.assessment.count({
      where: { userId },
    })
    return count > 0
  }
}
