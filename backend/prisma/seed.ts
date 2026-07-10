import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting database seeding...');

  // 1. Create Default Modules
  const modules = [
    { name: 'LISTENING' as const },
    { name: 'READING' as const },
    { name: 'WRITING' as const },
    { name: 'SPEAKING' as const },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { name: mod.name },
      update: {},
      create: { name: mod.name },
    });
  }
  console.log('[SEED] Default modules seeded.');

  // 2. Create Default Subscription Plans
  const plans = [
    {
      name: 'Free Starter Plan',
      code: 'FREE',
      price: 0.0,
      interval: 'MONTHLY' as const,
      features: ['5 Practice Questions/day', '1 Mock Test', 'Basic progress tracking'],
      limitLessons: 5,
      limitDailyPractice: 5,
      limitMockTests: 1,
      hasAiWriting: false,
      hasAiSpeaking: false,
      hasTutorReview: false,
    },
    {
      name: 'Basic Preparation Plan',
      code: 'BASIC',
      price: 15000.00,
      interval: 'MONTHLY' as const,
      features: ['20 Practice Questions/day', 'Unlimited Lessons', 'Full progress tracking'],
      limitLessons: -1,
      limitDailyPractice: 20,
      limitMockTests: 3,
      hasAiWriting: false,
      hasAiSpeaking: false,
      hasTutorReview: false,
    },
    {
      name: 'Pro AI Intensive Plan',
      code: 'PRO',
      price: 35000.00,
      interval: 'MONTHLY' as const,
      features: ['Unlimited Practice & Lessons', 'Unlimited Mock Tests', 'AI writing corrections', 'AI speaking evaluations'],
      limitLessons: -1,
      limitDailyPractice: -1,
      limitMockTests: -1,
      hasAiWriting: true,
      hasAiSpeaking: true,
      hasTutorReview: false,
    },
    {
      name: 'Premium Tutor Plan',
      code: 'PREMIUM',
      price: 75000.00,
      interval: 'MONTHLY' as const,
      features: ['Unlimited Practice, Lessons, & AI tools', 'Personalized Study Plans', '1-on-1 human tutor writing & speaking review'],
      limitLessons: -1,
      limitDailyPractice: -1,
      limitMockTests: -1,
      hasAiWriting: true,
      hasAiSpeaking: true,
      hasTutorReview: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        price: plan.price,
        features: plan.features,
        limitLessons: plan.limitLessons,
        limitDailyPractice: plan.limitDailyPractice,
        limitMockTests: plan.limitMockTests,
        hasAiWriting: plan.hasAiWriting,
        hasAiSpeaking: plan.hasAiSpeaking,
        hasTutorReview: plan.hasTutorReview,
      },
      create: plan,
    });
  }
  console.log('[SEED] Subscription plans seeded.');

  // 3. Create Default Users (Super Admin, Tutor, Student)
  const passwordHashAdmin = await bcrypt.hash('admin123', 10);
  const passwordHashTutor = await bcrypt.hash('tutor123', 10);
  const passwordHashStudent = await bcrypt.hash('student123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bandup.com' },
    update: {},
    create: {
      email: 'admin@bandup.com',
      passwordHash: passwordHashAdmin,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
    },
  });

  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@bandup.com' },
    update: {},
    create: {
      email: 'tutor@bandup.com',
      passwordHash: passwordHashTutor,
      name: 'Examiner John',
      role: 'TUTOR',
      isVerified: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@bandup.com' },
    update: {},
    create: {
      email: 'student@bandup.com',
      passwordHash: passwordHashStudent,
      name: 'Emma Watson',
      role: 'STUDENT',
      targetExam: 'ACADEMIC',
      targetBand: 7.5,
      isVerified: true,
    },
  });

  // Assign Free subscription and progress stats to student if missing
  const studentSub = await prisma.subscription.findFirst({
    where: { userId: student.id },
  });
  if (!studentSub) {
    const freePlan = await prisma.subscriptionPlan.findUnique({
      where: { code: 'FREE' },
    });
    if (freePlan) {
      await prisma.subscription.create({
        data: {
          userId: student.id,
          planId: freePlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
          autoRenew: false,
        },
      });
    }
  }

  const studentStats = await prisma.progressStats.findUnique({
    where: { userId: student.id },
  });
  if (!studentStats) {
    await prisma.progressStats.create({
      data: {
        userId: student.id,
        overallBandEstimate: 0.0,
        listeningHistory: [],
        readingHistory: [],
        writingHistory: [],
        speakingHistory: [],
        weakQuestionTypes: [],
      },
    });
  }

  console.log('[SEED] Test users and subscriptions seeded.');

  // 4. Create AppSettings (AI Configs & Prompts)
  const defaultSettings = [
    { key: 'ai_enabled', value: 'true', description: 'Global switch to enable/disable AI evaluations' },
    { key: 'active_ai_provider', value: 'openai', description: 'Active AI API provider: openai, gemini, anthropic, ollama, openrouter' },
    { key: 'ai_openai_key', value: '', description: 'OpenAI API key (encrypted)' },
    { key: 'ai_openai_model', value: 'gpt-4o', description: 'Model identifier for OpenAI' },
    { key: 'ai_openai_url', value: 'https://api.openai.com/v1', description: 'Base URL for OpenAI API' },
    { key: 'ai_gemini_key', value: '', description: 'Google Gemini API key (encrypted)' },
    { key: 'ai_gemini_model', value: 'gemini-1.5-pro', description: 'Model identifier for Google Gemini' },
    { key: 'ai_groq_key', value: '', description: 'Groq API key (encrypted)' },
    { key: 'ai_groq_model', value: 'llama-3.3-70b-versatile', description: 'Model identifier for Groq' },
    { key: 'ai_budget_daily', value: '50.00', description: 'Daily spending limit for AI features in USD' },
    { key: 'ai_budget_monthly', value: '1500.00', description: 'Monthly spending limit for AI features in USD' },
    
    // Writing evaluation prompt template
    { 
      key: 'prompt_writing_eval', 
      value: `You are an expert IELTS Writing Examiner. Evaluate the following IELTS writing submission based on the official descriptor band criteria:
- Task Achievement / Task Response
- Coherence and Cohesion
- Lexical Resource
- Grammatical Range and Accuracy

Provide:
1. Overall Estimated Band Score (0.0 - 9.0 in increments of 0.5)
2. Score breakdown per criterion
3. Sentence-by-sentence corrections and highlight errors
4. Highlight weak vocabulary and suggest advanced synonyms
5. A high-quality rewrite representing a Band 9.0 version of the essay
6. Explanation of changes and suggestions for improvement

Submission:
Task Type: {taskType}
Prompt: {promptText}
User Essay: {userText}`, 
      description: 'System prompt template for IELTS Writing evaluations' 
    },
    
    // Speaking evaluation prompt template
    { 
      key: 'prompt_speaking_eval', 
      value: `You are an expert IELTS Speaking Examiner. Evaluate the following transcribed IELTS speaking response based on these criteria:
- Fluency and Coherence
- Lexical Resource
- Grammatical Range and Accuracy
- Pronunciation Guidance

Provide:
1. Overall Estimated Band Score (0.0 - 9.0 in increments of 0.5)
2. Detailed explanation of weak points, grammatical errors, and pronunciation guidelines
3. A stronger rewritten script showing how the student could answer to achieve a Band 8.5+
4. Alternative natural phrases, collocations, and idiomatic expressions

Transcription:
Topic: {topic}
Cue Card/Questions: {cueCardText}
Student Transcript: {transcription}`, 
      description: 'System prompt template for IELTS Speaking evaluations' 
    },
    {
      key: 'manual_bank_payment_details',
      value: '{"accountName": "Joshua toritseju omatsuli", "bankName": "Opay", "accountNumber": "8158075936"}',
      description: 'Dynamic manual bank details for student subscription payments'
    },
    {
      key: 'referral_discount_percentage',
      value: '30',
      description: 'Automatic percentage discount applied to a referred user’s first month paid subscription'
    },
    {
      key: 'referral_reward_naira',
      value: '1000',
      description: 'Amount in Naira rewarded to the referrer upon successful registration of a referred student'
    },
    {
      key: 'referral_commission_type',
      value: 'FLAT',
      description: 'Strategy type for recurring referrer rewards on subscription checkouts. Valid values: NONE, FLAT, PERCENT.'
    },
    {
      key: 'referral_commission_value',
      value: '1000',
      description: 'The value applied to the referral recurring strategy. Flat amount (in Naira) or percentage percentage depending on strategy.'
    }
  ];

  for (const setting of defaultSettings) {
    await prisma.appSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        isEncrypted: setting.key.includes('key'), // Auto-encrypt API keys later or tag as encrypted
      },
    });
  }
  console.log('[SEED] Default app settings (AI configurations) seeded.');

  // 5. Seed Writing Prompts (Academic vs General Training)
  const writingPrompts = [
    {
      id: 'academic-w1',
      title: 'Global Fish & Meat Consumption',
      promptText: 'The graph below shows the consumption of fish and different kinds of meat in a European country between 1979 and 2004. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
      examType: 'ACADEMIC' as any,
      taskType: 'TASK_1',
      difficulty: 'INTERMEDIATE' as any,
    },
    {
      id: 'academic-w2',
      title: 'University Career Focus',
      promptText: 'Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer. Discuss both views and give your opinion.',
      examType: 'ACADEMIC' as any,
      taskType: 'TASK_2',
      difficulty: 'ADVANCED' as any,
    },
    {
      id: 'gt-w1',
      title: 'Complaining to Local Council',
      promptText: 'Write a letter to your local council complaining about a new restaurant nearby that is creating noise and parking problems. In your letter: explain who you are, detail the problems, and suggest what action they should take.',
      examType: 'GENERAL' as any,
      taskType: 'TASK_1',
      difficulty: 'BEGINNER' as any,
    },
    {
      id: 'gt-w2',
      title: 'Modern Job Market Competition',
      promptText: 'In many countries, more and more people are competing for jobs. What are the causes of this competition? What strategies can individuals use to stand out in a competitive job market?',
      examType: 'GENERAL' as any,
      taskType: 'TASK_2',
      difficulty: 'INTERMEDIATE' as any,
    },
  ];

  for (const wp of writingPrompts) {
    await prisma.writingPrompt.upsert({
      where: { id: wp.id },
      update: {},
      create: wp,
    });
  }
  console.log('[SEED] Writing prompts seeded.');

  // 6. Seed Speaking Prompts
  const speakingPrompts = [
    {
      id: 'speaking-p1',
      part: 1,
      topic: 'Hometown and Studies',
      cueCardText: 'Let’s talk about your hometown. Where is your hometown? What do you like most about it?',
      followUpQuestions: ['Do you think your hometown is a good place for young people to live?'],
      difficulty: 'BEGINNER' as any,
    },
    {
      id: 'speaking-p2',
      part: 2,
      topic: 'An Interesting Journey',
      cueCardText: 'Describe an interesting journey you have been on. You should say: where you went, how you travelled, why you went there, and explain what made the journey so interesting.',
      followUpQuestions: ['Do you prefer travelling alone or with friends?', 'Has travel changed compared to the past?'],
      difficulty: 'INTERMEDIATE' as any,
    },
  ];

  for (const sp of speakingPrompts) {
    await prisma.speakingPrompt.upsert({
      where: { id: sp.id },
      update: {},
      create: sp,
    });
  }
  console.log('[SEED] Speaking prompts seeded.');

  console.log('[SEED] Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
