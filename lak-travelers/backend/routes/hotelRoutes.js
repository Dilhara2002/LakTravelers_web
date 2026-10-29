import express from 'express';
import { protect, vendor } from '../middleware/authMiddleware.js';
import {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  createHotelReview,
} from '../controllers/hotelController.js';

const router = express.Router();



// Retrieving all hotels and adding a new hotel

router.route('/')
  .get(getHotels)
  .post(protect, vendor, createHotel);


router.route('/:id').get(getHotelById);





router.route('/:id/reviews').post(protect, createHotelReview);





router.route('/:id')
  .put(protect, vendor, updateHotel)
  .delete(protect, vendor, deleteHotel);

export default router;