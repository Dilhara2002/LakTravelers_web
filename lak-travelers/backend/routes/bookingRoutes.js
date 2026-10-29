import express from 'express';
import { protect, admin, vendor } from '../middleware/authMiddleware.js';
import { 
  createBooking,
  getMyBookings,
  getAllBookings, 
  getMyVendorBookings, 
  updateBookingStatus,
  cancelBooking 
} from '../controllers/bookingController.js';

const router = express.Router();

/**
 * @route   GET /api/bookings/mybookings
 * @desc    Get logged in user bookings
 * @access  Private
 */
router.get('/mybookings', protect, getMyBookings); 

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.route('/').post(protect, createBooking);

/**
 * @route   PUT /api/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private
 */
router.put('/:id/cancel', protect, cancelBooking);


/**
 * @route   GET /api/bookings/vendor/my
 * @desc    Get bookings related to vendor services
 * @access  Private/Vendor
 */
router.get('/vendor/my', protect, vendor, getMyVendorBookings);

/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Update booking status (Accept/Reject/Complete)
 * @access  Private/Vendor
 */
router.put('/:id/status', protect, vendor, updateBookingStatus);


/**
 * @route   GET /api/bookings/admin/all
 * @desc    Get all bookings in the system for admin
 * @access  Private/Admin
 */
router.get('/admin/all', protect, admin, getAllBookings);

export default router;