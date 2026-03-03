import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
      // 生成本地音频 URL
      const audioUrl = `/audio/level${sentence.level}/${String(sentence.seqNo).padStart(3, '0')}.mp3`

      await prisma.sentence.create({
        data: {
          level: sentence.level,
          seqNo: sentence.seqNo,
          enText: sentence.enText,
          zhText: sentence.zhText,
          audioUrl: audioUrl,
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
