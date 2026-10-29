import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getAdminStats } from '../controllers/adminController.js';

const router = express.Router();

/**
 * @route   GET /api/admin/stats
 * @desc    Admin Dashboard එක සඳහා සංඛ්‍යාලේඛන (Stats) ලබා ගැනීම
 * @access  Private/Admin
 */
router.get('/stats', protect, admin, getAdminStats);

export default router;