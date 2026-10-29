import express from 'express';
import { chatWithAI } from '../controllers/aiController.js';
import Plan from '../models/Plan.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// AI Chat Route
router.post('/chat', aiLimiter, chatWithAI);

// Optional: Add a test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Lak Travelers AI Assistant is running!',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

router.post('/save-plan', protect, async (req, res) => {
  const { location, duration, preferences, itinerary } = req.body;
  if (typeof location !== 'string' || !location.trim() || typeof itinerary !== 'string' || !itinerary.trim()) {
    return res.status(400).json({ success: false, message: 'Location and itinerary are required.' });
  }
  const durationDays = Number(duration);
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 30) {
    return res.status(400).json({ success: false, message: 'Duration must be between 1 and 30 days.' });
  }
  const plan = new Plan({
    user: req.user._id,
    location: location.trim(),
    duration: durationDays,
    preferences: typeof preferences === 'string' ? preferences.trim() : '',
    itinerary: itinerary.trim(),
  });
  const savedPlan = await plan.save();
  return res.status(201).json(savedPlan);
});

router.get('/my-plans', protect, async (req, res) => {
  const plans = await Plan.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(plans);
});


router.delete('/plan/:id', protect, async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (plan && plan.user.toString() === req.user._id.toString()) {
    await Plan.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Plan removed successfully' });
  } else {
    return res.status(404).json({ success: false, message: 'Plan not found or unauthorized' });
  }
});

export default router;
