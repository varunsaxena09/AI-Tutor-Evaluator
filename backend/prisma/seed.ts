import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@tutor.com' },
    update: {},
    create: {
      email: 'admin@tutor.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const studentPassword = await bcrypt.hash('tutor123', 10);
  await prisma.user.upsert({
    where: { email: 'tutor@test.com' },
    update: {},
    create: {
      email: 'tutor@test.com',
      name: 'Candidate Tutor',
      password: studentPassword,
      role: 'CANDIDATE',
    },
  });

  const questions = [
    // Diff 1
    { text: "What is 2 + 2?", difficulty: 1, order: 1 },
    { text: "How many colors are in a rainbow?", difficulty: 1, order: 2 },
    { text: "What noise does a cow make?", difficulty: 1, order: 3 },
    { text: "Can you spell the word 'cat'?", difficulty: 1, order: 4 },
    { text: "What is the opposite of hot?", difficulty: 1, order: 5 },
    // Diff 2
    { text: "Explain the difference between plant and animal cells in simple terms.", difficulty: 2, order: 1 },
    { text: "How would you explain the concept of fractions to a 10-year-old?", difficulty: 2, order: 2 },
    { text: "Describe what happens during photosynthesis.", difficulty: 2, order: 3 },
    { text: "What are the three states of matter?", difficulty: 2, order: 4 },
    { text: "Why do we have leap years?", difficulty: 2, order: 5 },
    // Diff 3
    { text: "A student becomes frustrated and says they hate learning. How do you respond?", difficulty: 3, order: 1 },
    { text: "Describe a time when you had to adapt your teaching style for someone who wasn't grasping the material.", difficulty: 3, order: 2 },
    { text: "What is your approach to giving constructive feedback when a student keeps making the same mistake?", difficulty: 3, order: 3 },
    { text: "How do you handle a student who is constantly distracted during a lesson?", difficulty: 3, order: 4 },
    { text: "Explain the concept of gravity to an 8-year-old.", difficulty: 3, order: 5 },
    // Diff 4
    { text: "Explain the concept of Object-Oriented Programming using a real-world analogy.", difficulty: 4, order: 1 },
    { text: "How do you explain the theory of relativity to a high schooler?", difficulty: 4, order: 2 },
    { text: "Walk me through how a computer processes a search engine request.", difficulty: 4, order: 3 },
    { text: "Explain the causes of the First World War in under two minutes.", difficulty: 4, order: 4 },
    { text: "How would you teach a student about compound interest and its implications?", difficulty: 4, order: 5 },
    // Diff 5
    { text: "Explain the principles of quantum entanglement and its potential applications.", difficulty: 5, order: 1 },
    { text: "Discuss the socio-economic impacts of adopting renewable energy globally.", difficulty: 5, order: 2 },
    { text: "How would you teach the concept of NP-completeness to a college freshman?", difficulty: 5, order: 3 },
    { text: "Explain how artificial neural networks learn from data.", difficulty: 5, order: 4 },
    { text: "Describe the physiological process of the immune system fighting a virus at the cellular level.", difficulty: 5, order: 5 }
  ];

  await prisma.communicationMetrics.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.interviewSession.deleteMany({});
  await prisma.question.deleteMany({});
  
  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
