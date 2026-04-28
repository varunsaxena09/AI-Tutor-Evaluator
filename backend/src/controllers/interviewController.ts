import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { evaluateCandidateAnswer } from '../services/aiService';

export const getQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getNextQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.interviewSession.findUnique({
      where: { id: Number(sessionId) },
      include: { answers: true }
    });

    if (!session || session.candidateId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (session.answers.length >= 5) {
      return res.json({ isComplete: true });
    }

    let difficulty = session.maxDifficultyReached || 1;

    if (session.answers.length > 0) {
      const lastAnswer = session.answers[session.answers.length - 1] as any;

      if ((lastAnswer.correctness || '').toLowerCase() === 'correct') {
        difficulty++;
      } else {
        difficulty--;
      }

      difficulty = Math.max(1, Math.min(5, difficulty));

      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { maxDifficultyReached: difficulty }
      });
    }

    const answeredIds = session.answers.map(a => a.questionId);

    let questions = await prisma.question.findMany({
      where: {
        difficulty,
        id: { notIn: answeredIds }
      }
    });

    if (questions.length === 0) {
      questions = await prisma.question.findMany({
        where: { id: { notIn: answeredIds } }
      });
    }

    const nextQuestion =
      questions[Math.floor(Math.random() * questions.length)];

    res.json({
      question: nextQuestion,
      currentDifficulty: difficulty,
      questionIndex: session.answers.length + 1
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const session = await prisma.interviewSession.create({
      data: { candidateId: req.user!.id, maxDifficultyReached: 1 }
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const submitAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { questionId, transcript } = req.body;

    const session = await prisma.interviewSession.findUnique({
      where: { id: Number(sessionId) }
    });

    if (!session || session.candidateId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const question = await prisma.question.findUnique({
      where: { id: Number(questionId) }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const { metrics, evaluation: aiEval } =
      await evaluateCandidateAnswer(question.text, transcript);

    const normalize = (val: any) => {
      if (!val) return 'incorrect';
      const v = val.toLowerCase();
      if (v === 'correct') return 'correct';
      if (v === 'partial') return 'partial';
      return 'incorrect';
    };

    const correctness = normalize(aiEval.correctness);

    const answer = await prisma.answer.create({
      data: {
        sessionId: Number(sessionId),
        questionId: Number(questionId),
        transcript,
        correctness,
        score: aiEval.overallScore || 0,
        metrics: {
          create: metrics
        }
      },
      include: { metrics: true }
    });

    const answerCount = await prisma.answer.count({
      where: { sessionId: session.id }
    });

    if (answerCount >= 5) {
      return res.json({ answer, aiEval, isComplete: true });
    }

    res.json({ answer, aiEval, isComplete: false });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const evaluateSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.interviewSession.findUnique({
      where: { id: Number(sessionId) },
      include: { answers: { include: { metrics: true } } }
    });

    if (!session || session.candidateId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const total = session.answers.length || 1;

    // correct = 1 point, partial = 0.5 point
    const correctAnswers = session.answers.reduce((acc, a) => {
      const c = ((a as any).correctness || '').toLowerCase();
      if (c === 'correct') return acc + 1;
      if (c === 'partial') return acc + 0.5;
      return acc;
    }, 0);

    const accuracy = (correctAnswers / total) * 100;

    const confidenceScore =
      session.answers.reduce((acc, a) => acc + (a.metrics?.confidenceScore || 0), 0) / total;

    const clarityScore =
      session.answers.reduce((acc, a) => acc + (a.metrics?.vocabularyRichness || 0), 0) / total * 10;

    const fluencyScore = Math.min(10, confidenceScore * 1.05);
    const warmthScore = Math.min(10, confidenceScore * 1.2);
    const simplicityScore = Math.min(10, confidenceScore * 0.9);
    const patienceScore = Math.min(10, confidenceScore * 1.15);
    const communicationScore = (clarityScore + fluencyScore) / 2;

    const totalFillerWords = session.answers.reduce(
      (acc, a) => acc + (a.metrics?.fillerCount || 0), 0
    );

    const totalPauses = session.answers.reduce(
      (acc, a) => acc + (a.metrics?.pauseCount || 0), 0
    );

    const avgPace =
      session.answers.reduce((acc, a) => acc + (a.metrics?.speakingPace || 0), 0) / total;

    const avgVocab =
      session.answers.reduce((acc, a) => acc + (a.metrics?.vocabularyRichness || 0), 0) / total;

    const overallScore = Math.min(100, accuracy);

    const recommendation =
      accuracy >= 60 && confidenceScore >= 5 ? 'SELECTED' : 'REJECTED';

    // ✅ Save to Evaluation table so dashboard can display it
    const evaluation = await prisma.evaluation.upsert({
      where: { sessionId: Number(sessionId) },
      update: {
        overallScore,
        confidenceScore,
        clarityScore,
        warmthScore,
        simplicityScore,
        patienceScore,
        fluencyScore,
        communicationScore,
        totalFillerWords,
        totalPauses,
        speakingPace: avgPace,
        vocabularyRichness: avgVocab,
        recommendation: recommendation as any,
        detailedFeedback: 'Aggregated feedback from the session.'
      },
      create: {
        sessionId: Number(sessionId),
        overallScore,
        confidenceScore,
        clarityScore,
        warmthScore,
        simplicityScore,
        patienceScore,
        fluencyScore,
        communicationScore,
        totalFillerWords,
        totalPauses,
        speakingPace: avgPace,
        vocabularyRichness: avgVocab,
        recommendation: recommendation as any,
        detailedFeedback: 'Aggregated feedback from the session.'
      }
    });

    // ✅ Return data for result page + saved evaluation for dashboard
    res.json({
      totalQuestions: total,
      correctAnswers,
      accuracy,
      communicationScore,
      confidenceScore,
      totalFillerWords,
      totalPauses,
      result: recommendation,
      evaluation
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};