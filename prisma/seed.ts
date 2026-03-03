import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  const dataPath = path.join(__dirname, '../data/sample-sentences.json')
  const rawData = fs.readFileSync(dataPath, 'utf-8')
  const { sentences } = JSON.parse(rawData)

  console.log(`📝 Found ${sentences.length} sentences to import`)

  for (const sentence of sentences) {
    const existing = await prisma.sentence.findFirst({
      where: {
        level: sentence.level,
        seqNo: sentence.seqNo,
      },
    })

    if (!existing) {
      await prisma.sentence.create({
        data: {
          level: sentence.level,
          seqNo: sentence.seqNo,
          enText: sentence.enText,
          zhText: sentence.zhText,
          audioUrl: sentence.audioUrl,
          ttsEnabled: true,
          status: 'active',
        },
      })
      console.log(
        `✅ Created sentence: Level ${sentence.level}, Seq ${sentence.seqNo}`
      )
    }
  }

  console.log('✨ Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
