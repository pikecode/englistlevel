import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class SentenceRepository {
  async getSentencesByLevel(level: number) {
    return prisma.sentence.findMany({
      where: {
        level,
        status: 'active',
      },
      orderBy: { seqNo: 'asc' },
    })
  }

  async getSentenceById(sentenceId: string) {
    return prisma.sentence.findUnique({
      where: { id: sentenceId },
    })
  }

  async createSentence(data: {
    level: number
    seqNo: number
    enText: string
    zhText: string
    audioUrl?: string
  }) {
    return prisma.sentence.create({
      data,
    })
  }

  async createMany(sentences: Array<{
    level: number
    seqNo: number
    enText: string
    zhText: string
    audioUrl?: string
  }>) {
    return prisma.sentence.createMany({
      data: sentences,
      skipDuplicates: true,
    })
  }

  async getSentenceCount(level: number) {
    return prisma.sentence.count({
      where: {
        level,
        status: 'active',
      },
    })
  }
}
