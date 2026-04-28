import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { getQuestions, createSession, submitAnswer, evaluateSession, getNextQuestion } from '../controllers/interviewController';

const router = Router();

router.use(authenticateToken);

router.get('/questions', getQuestions);
router.post('/session', createSession);
router.get('/session/:sessionId/next-question', getNextQuestion as any);
router.post('/session/:sessionId/answer', submitAnswer as any);
router.post('/session/:sessionId/evaluate', evaluateSession as any);

export default router;
