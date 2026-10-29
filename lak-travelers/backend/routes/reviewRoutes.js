import express from "express";
import { submitReview, getServiceReputation } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import Review from "../models/Review.js";

const router = express.Router();

/**
 * @desc    Fetch all reviews from across the platform
 * @route   GET /api/reviews/all
 * @access  Public (Used for the Community Feed)
 */
router.get("/all", async (req, res) => {
    try {
        // Populates the user name and sorts by most recent for the feed
        const reviews = await Review.find()
            .populate("user", "name")
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Submit a new review
 * @route   POST /api/reviews/submit
 * @access  Private (Requires authentication via Protect middleware)
 */
router.post("/submit", protect, submitReview);

export default router;