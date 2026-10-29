import Review from "../models/Review.js";
import Hotel from "../models/Hotel.js";
import Vehicle from "../models/Vehicle.js";

/**
 * 📝 SUBMIT REVIEW & RECALIBRATE TRUST SCORE
 * CCTNS Process: Collect -> Analyze -> Recalibrate
 */
export const submitReview = async (req, res) => {
  try {
    const { targetId, targetType, comment, safetyScore, hygieneScore, serviceQuality, mediaUrl } = req.body;
    const userId = req.user._id;

    if (!['hotel', 'vehicle'].includes(targetType)) {
      return res.status(400).json({ success: false, message: 'Invalid review target type' });
    }
    if (!comment || comment.trim().length < 10 || comment.length > 2000) {
      return res.status(400).json({ success: false, message: 'Review must be between 10 and 2000 characters' });
    }
    const existingReview = await Review.findOne({ user: userId, [targetType]: targetId });
    if (existingReview) return res.status(409).json({ success: false, message: 'You already reviewed this service' });

    // 1. Collect: Storing the new review
    const review = await Review.create({
      user: userId,
      [targetType]: targetId,
      comment,
      safetyScore,
      hygieneScore,
      serviceQuality,
      mediaUrl
    });

    // 2. Analyze & Recalibrate: Updating the service level
// Retrieves all reviews of the relevant hotel or vehicle and calculates the average value.
    const allReviews = await Review.find({ [targetType]: targetId });
    
    const avgSafety = allReviews.reduce((acc, curr) => acc + curr.safetyScore, 0) / allReviews.length;
    const avgHygiene = allReviews.reduce((acc, curr) => acc + curr.hygieneScore, 0) / allReviews.length;
    
    // AI Reputation Modeling: Trust Score calculate 
    const avgService = allReviews.reduce((acc, curr) => acc + curr.serviceQuality, 0) / allReviews.length;
    const newTrustScore = Math.round(((avgSafety + avgHygiene + avgService) / 3) * 10);

    // 3. Update Service Node: Graph data update
    if (targetType === "hotel") {
      await Hotel.findByIdAndUpdate(targetId, { reputationScore: newTrustScore });
    } else if (targetType === "vehicle") {
      await Vehicle.findByIdAndUpdate(targetId, { reputationScore: newTrustScore });
    }

    res.status(201).json({
      success: true,
      message: "Review submitted. AI Trust Score recalibrated! 🛡️",
      newTrustScore
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 📈 GET REPUTATION DATA
 * AI Nudging 
 */
export const getServiceReputation = async (req, res) => {
    try {
        const { id } = req.params;
        const reviews = await Review.find({ hotel: id }).populate("user", "name");
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
