import express from 'express';
import { getTours, createTour, getTourById, deleteTour, updateTour, createTourReview } from '../controllers/tourController.js';
import { protect, vendor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getTours).post(protect, vendor, createTour);
router.route('/:id').get(getTourById).put(protect, vendor, updateTour).delete(protect, vendor, deleteTour);
router.route('/:id/reviews').post(protect, createTourReview);

export default router;
