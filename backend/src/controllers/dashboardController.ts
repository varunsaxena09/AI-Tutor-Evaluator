import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const candidates = await prisma.user.findMany({
      where: { role: 'CANDIDATE' },
      include: {
        sessions: {
          include: {
            evaluation: true
          }
        }
      }
    });

    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCandidateDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { candidateId: req.user!.id },
      include: {
        evaluation: true,
        answers: {
          include: {
             question: true,
             metrics: true
          }
        }
      }
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
