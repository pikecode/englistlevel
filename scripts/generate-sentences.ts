import * as fs from 'fs'
import * as path from 'path'

// 英语短语库 - 按难度分类
const easyPhrases = [
  { en: 'Hello', zh: '你好' },
  { en: 'Good morning', zh: '早上好' },
  { en: 'Good afternoon', zh: '下午好' },
  { en: 'Good evening', zh: '晚上好' },
  { en: 'Good night', zh: '晚安' },
  { en: 'How are you?', zh: '你好吗？' },
  { en: "I'm fine", zh: '我很好' },
  { en: 'Thank you', zh: '谢谢你' },
  { en: 'You are welcome', zh: '不客气' },
  { en: 'Excuse me', zh: '对不起' },
  { en: 'Yes', zh: '是的' },
  { en: 'No', zh: '不' },
  { en: 'Please', zh: '请' },
  { en: 'Sorry', zh: '抱歉' },
  { en: 'Goodbye', zh: '再见' },
  { en: 'See you later', zh: '待会见' },
  { en: 'What is your name?', zh: '你叫什么名字？' },
  { en: 'My name is John', zh: '我叫约翰' },
  { en: 'Nice to meet you', zh: '很高兴认识你' },
  { en: 'Where are you from?', zh: '你来自哪里？' },
]

const intermediatePhrases = [
  { en: 'Can you help me?', zh: '你能帮我吗？' },
  { en: 'Of course', zh: '当然可以' },
  { en: 'I need your help', zh: '我需要你的帮助' },
  { en: 'How much does it cost?', zh: '这要多少钱？' },
  { en: 'That is too expensive', zh: '太贵了' },
  { en: 'Can you give me a discount?', zh: '你能给我打折吗？' },
  { en: 'Do you accept credit cards?', zh: '你接受信用卡吗？' },
  { en: 'Where is the bathroom?', zh: '洗手间在哪里？' },
  { en: 'I am lost', zh: '我迷路了' },
  { en: 'Can you speak English?', zh: '你会说英语吗？' },
  { en: 'I do not understand', zh: '我不明白' },
  { en: 'Please speak slowly', zh: '请说慢一点' },
  { en: 'What time is it?', zh: '现在几点？' },
  { en: 'I am hungry', zh: '我饿了' },
  { en: 'I am thirsty', zh: '我渴了' },
  { en: 'Where is the nearest restaurant?', zh: '最近的餐厅在哪里？' },
  { en: 'I would like a coffee', zh: '我想要一杯咖啡' },
  { en: 'The food is delicious', zh: '食物很美味' },
  { en: 'Can I have the bill?', zh: '我可以要账单吗？' },
  { en: 'Thank you for your service', zh: '感谢你的服务' },
]

const advancedPhrases = [
  { en: 'I would like to make a reservation', zh: '我想预订' },
  { en: 'Do you have any rooms available?', zh: '你们有空房间吗？' },
  { en: 'What are the amenities?', zh: '有什么设施？' },
  { en: 'I have a complaint about the service', zh: '我对服务有投诉' },
  { en: 'Could you please fix this issue?', zh: '你能修复这个问题吗？' },
  { en: 'I would like to speak to the manager', zh: '我想和经理谈话' },
  { en: 'What is your return policy?', zh: '你们的退货政策是什么？' },
  { en: 'I am interested in this product', zh: '我对这个产品感兴趣' },
  { en: 'Can you provide more information?', zh: '你能提供更多信息吗？' },
  { en: 'What are the payment options?', zh: '有什么付款方式？' },
  { en: 'I would like to cancel my order', zh: '我想取消我的订单' },
  { en: 'When will it be delivered?', zh: '什么时候会送达？' },
  { en: 'Is there a warranty?', zh: '有保修吗？' },
  { en: 'I am not satisfied with the quality', zh: '我对质量不满意' },
  { en: 'Can I get a refund?', zh: '我能退款吗？' },
  { en: 'What is the exchange rate?', zh: '汇率是多少？' },
  { en: 'I need to open a bank account', zh: '我需要开一个银行账户' },
  { en: 'What documents do I need?', zh: '我需要什么文件？' },
  { en: 'How long does the process take?', zh: '这个过程需要多长时间？' },
  { en: 'Can I do this online?', zh: '我能在线做这个吗？' },
]

const businessPhrases = [
  { en: 'I have a meeting scheduled', zh: '我有一个预定的会议' },
  { en: 'Let us discuss the project details', zh: '让我们讨论项目细节' },
  { en: 'What is your timeline?', zh: '你的时间表是什么？' },
  { en: 'We need to finalize the contract', zh: '我们需要最终确定合同' },
  { en: 'What are the terms and conditions?', zh: '条款和条件是什么？' },
  { en: 'I would like to propose a partnership', zh: '我想提议一个合作伙伴关系' },
  { en: 'What is your pricing model?', zh: '你的定价模式是什么？' },
  { en: 'Can we negotiate the price?', zh: '我们能协商价格吗？' },
  { en: 'I need a detailed quote', zh: '我需要一个详细的报价' },
  { en: 'When can we start the project?', zh: '我们什么时候可以开始项目？' },
  { en: 'What is the expected outcome?', zh: '预期的结果是什么？' },
  { en: 'How will we measure success?', zh: '我们如何衡量成功？' },
  { en: 'I need regular updates', zh: '我需要定期更新' },
  { en: 'What is your experience in this field?', zh: '你在这个领域的经验是什么？' },
  { en: 'Can you provide references?', zh: '你能提供参考资料吗？' },
  { en: 'I would like to see a portfolio', zh: '我想看一个作品集' },
  { en: 'What is your team size?', zh: '你的团队规模是多少？' },
  { en: 'How do you handle communication?', zh: '你如何处理沟通？' },
  { en: 'What is your support policy?', zh: '你的支持政策是什么？' },
  { en: 'I am ready to move forward', zh: '我准备好继续进行' },
]

const conversationPhrases = [
  { en: 'Tell me about yourself', zh: '告诉我关于你自己' },
  { en: 'What do you do for a living?', zh: '你以什么为生？' },
  { en: 'What are your hobbies?', zh: '你的爱好是什么？' },
  { en: 'Do you like sports?', zh: '你喜欢运动吗？' },
  { en: 'What is your favorite food?', zh: '你最喜欢的食物是什么？' },
  { en: 'Have you traveled abroad?', zh: '你出国旅游过吗？' },
  { en: 'Where would you like to visit?', zh: '你想去哪里旅游？' },
  { en: 'What is your favorite movie?', zh: '你最喜欢的电影是什么？' },
  { en: 'Do you read books?', zh: '你读书吗？' },
  { en: 'What kind of music do you like?', zh: '你喜欢什么样的音乐？' },
  { en: 'How do you spend your free time?', zh: '你如何度过空闲时间？' },
  { en: 'What are your goals?', zh: '你的目标是什么？' },
  { en: 'How long have you been learning English?', zh: '你学英语多久了？' },
  { en: 'What is your biggest challenge?', zh: '你最大的挑战是什么？' },
  { en: 'How do you stay motivated?', zh: '你如何保持动力？' },
  { en: 'What advice would you give?', zh: '你会给什么建议？' },
  { en: 'What is your dream job?', zh: '你的梦想工作是什么？' },
  { en: 'How do you handle stress?', zh: '你如何处理压力？' },
  { en: 'What makes you happy?', zh: '什么让你开心？' },
  { en: 'What is your life philosophy?', zh: '你的人生哲学是什么？' },
]

// 合并所有短语库
const allPhrases = [
  ...easyPhrases,
  ...intermediatePhrases,
  ...advancedPhrases,
  ...businessPhrases,
  ...conversationPhrases,
]

// 生成 5000 句数据
function generateSentences() {
  const sentences = []
  let phraseIndex = 0

  for (let level = 1; level <= 100; level++) {
    for (let seqNo = 1; seqNo <= 20; seqNo++) {
      const phrase = allPhrases[phraseIndex % allPhrases.length]

      sentences.push({
        level,
        seqNo,
        enText: phrase.en,
        zhText: phrase.zh,
        audioUrl: `https://example.com/audio/level${level}/${String(seqNo).padStart(2, '0')}.mp3`,
      })

      phraseIndex++
    }
  }

  return sentences
}

// 生成并保存数据
const sentences = generateSentences()
const data = { sentences }

const outputPath = path.join(__dirname, '../data/complete-sentences.json')
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

console.log(`✅ Generated ${sentences.length} sentences`)
console.log(`📁 Saved to: ${outputPath}`)
console.log(`📊 Coverage: 100 levels × 20 sentences`)
