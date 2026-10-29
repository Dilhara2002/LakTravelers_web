import express from 'express';
import { 
  getVehicles, 
  createVehicle, 
  getVehicleById, 
  deleteVehicle, 
  updateVehicle, 
  createVehicleReview 
} from '../controllers/vehicleController.js';
import { protect, vendor } from '../middleware/authMiddleware.js';

const router = express.Router();


router.route('/')
  .get(getVehicles)             
  .post(protect, vendor, createVehicle); 


router.route('/:id')
  .get(getVehicleById)          
  .put(protect, vendor, updateVehicle)  
  .delete(protect, vendor, deleteVehicle); 

// 
router.route('/:id/reviews')
  .post(protect, createVehicleReview); 

export default router;
