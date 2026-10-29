import express from 'express';
import { googleClientId } from '../utils/googleAuthentication.js';
import {
  registerUser,
  sendOTP,
  authUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  updateVendorProfile,
  getPendingVendors,
  approveVendor,
  getAdminStats,
  rejectVendor,
  getUsers,
  adminUpdateUser,
  adminCreateUser,
  adminDeleteUser,

  // Social Login
  googleLogin,

} from '../controllers/userController.js';

import { protect, admin } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @section Public Routes
 */
router.post('/', authLimiter, registerUser);
router.post('/send-otp', authLimiter, sendOTP);
router.post('/auth', authLimiter, authUser);
router.post('/logout', logoutUser);

/**
 * Social Login Routes
 */
// Client IDs are public identifiers; never expose client secrets or other environment settings.
router.get('/google/config', (_req, res) => {
  const clientId = googleClientId();
  res.set('Cache-Control', 'no-store').json({ enabled: Boolean(clientId), clientId });
});
router.post('/google', authLimiter, googleLogin);

/**
 * @section Protected Routes (Logged in users only)
 */
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.put('/vendor-profile', protect, updateVendorProfile);

/**
 * @section Admin Management Routes (Full CRUD for Admin)
 */
router.get('/admin/all', protect, admin, getUsers);

router.post('/admin/create', protect, admin, adminCreateUser);
router.put('/admin/update/:id', protect, admin, adminUpdateUser);
router.delete('/admin/:id', protect, admin, adminDeleteUser);

/**
 * @section Vendor Approval System
 */
router.get('/pending', protect, admin, getPendingVendors);

router.put('/approve/:id', protect, admin, approveVendor);
router.delete('/reject/:id', protect, admin, rejectVendor);

/**
 * @section Dashboard Statistics
 */
router.get('/admin-stats', protect, admin, getAdminStats);

export default router;
