import { AssessmentRepository } from '@/lib/repositories/assessment.repository'
import { SentenceRepository } from '@/lib/repositories/sentence.repository'
import { ProgressRepository } from '@/lib/repositories/progress.repository'
import { UserRepository } from '@/lib/repositories/user.repository'

const assessmentRepo = new AssessmentRepository()
const sentenceRepo = new SentenceRepository()
const progressRepo = new ProgressRepository()
const userRepo = new UserRepository()

const ASSESSMENT_QUESTION_COUNT = 20

export class AssessmentService {
  async generateAssessmentQuestions() {
    const level1Sentences = await sentenceRepo.getSentencesByLevel(1)
    const level2Sentences = await sentenceRepo.getSentencesByLevel(2)

    const allSentences = [...level1Sentences, ...level2Sentences]

    if (allSentences.length < ASSESSMENT_QUESTION_COUNT) {
      throw new Error('Not enough sentences for assessment')
    }

    const questions = this.shuffleArray(allSentences).slice(
      0,
      ASSESSMENT_QUESTION_COUNT
    )

    return questions.map((sentence) => ({
      id: sentence.id,
      enText: sentence.enText,
      zhText: sentence.zhText,
      audioUrl: sentence.audioUrl,
      options: this.generateOptions(sentence.zhText, allSentences),
    }))
  }

  private generateOptions(correctAnswer: string, allSentences: any[]) {
    const options = [correctAnswer]

    const distractors = this.shuffleArray(allSentences)
      .filter((s) => s.zhText !== correctAnswer)
      .slice(0, 3)
      .map((s) => s.zhText)

    options.push(...distractors)

    return this.shuffleArray(options)
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  async submitAssessment(
    userId: string,
    answers: Array<{
      questionId: string
      selectedAnswer: string
    }>
  ) {
    if (answers.length !== ASSESSMENT_QUESTION_COUNT) {
      throw new Error(
        `Expected ${ASSESSMENT_QUESTION_COUNT} answers, got ${answers.length}`
      )
    }

    let correctCount = 0

    for (const answer of answers) {
      const sentence = await sentenceRepo.getSentenceById(answer.questionId)
      if (!sentence) continue

      if (sentence.zhText === answer.selectedAnswer) {
        correctCount++
      }
    }

    const score = Math.round((correctCount / ASSESSMENT_QUESTION_COUNT) * 100)
    const suggestedLevel = this.calculateSuggestedLevel(score)

    const assessment = await assessmentRepo.createAssessment({
      userId,
      score,
      questionCount: ASSESSMENT_QUESTION_COUNT,
      correctCount,
      suggestedLevel,
      confirmedLevel: suggestedLevel,
    })

    const user = await userRepo.findById(userId)
    if (user && user.currentLevel === 1) {
      await userRepo.update(userId, {
        currentLevel: suggestedLevel,
      })

      for (let level = 1; level <= suggestedLevel; level++) {
        const existing = await progressRepo.getLevelProgress(userId, level)
        if (!existing) {
          await progressRepo.createLevelProgress(userId, level)
        }
      }
    }

    return {
      assessmentId: assessment.id,
      score,
      correctCount,
      questionCount: ASSESSMENT_QUESTION_COUNT,
      suggestedLevel,
      confirmedLevel: assessment.confirmedLevel,
      message: this.getScoreMessage(score),
    }
  }

  private calculateSuggestedLevel(score: number): number {
    if (score >= 80) return 10
    if (score >= 60) return 5
    return 1
  }

  private getScoreMessage(score: number): string {
    if (score >= 90) return 'Excellent! You have a strong foundation.'
    if (score >= 70) return 'Good! You are ready to start learning.'
    if (score >= 50) return 'Fair. Keep practicing to improve.'
    return 'Keep working hard! You will improve soon.'
  }

  async shouldUserTakeAssessment(userId: string): Promise<boolean> {
    const user = await userRepo.findById(userId)
    if (!user) throw new Error('User not found')

    if (user.currentLevel === 1) {
      const hasAssessment = await assessmentRepo.hasUserTakenAssessment(userId)
      return !hasAssessment
    }

    return false
  }
}
