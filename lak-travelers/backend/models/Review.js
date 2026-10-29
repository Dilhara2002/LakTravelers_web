import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  comment: { type: String, required: true },
  
  // CCTNS Pillars: Community feedback metrics
  safetyScore: { type: Number, min: 1, max: 10, default: 5 },
  hygieneScore: { type: Number, min: 1, max: 10, default: 5 },
  serviceQuality: { type: Number, min: 1, max: 10, default: 5 },
  mediaUrl: { type: String }, // Photos/Videos sharing
  isAuthentic: { type: Boolean, default: true }, // AI filters manipulated reviews
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;