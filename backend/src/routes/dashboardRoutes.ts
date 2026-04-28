import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware';
import { getAdminDashboard, getCandidateDashboard } from '../controllers/dashboardController';

const router = Router();

router.get('/admin', authenticateToken, requireAdmin, getAdminDashboard as any);
router.get('/candidate', authenticateToken, getCandidateDashboard as any);

export default router;
