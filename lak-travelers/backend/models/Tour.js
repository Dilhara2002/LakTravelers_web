import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  image: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true });

const tourSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: [true, 'Please add a tour name'] },
  description: { type: String, required: [true, 'Please add a description'] },
  destinations: { type: String, required: [true, 'Please add destinations'] },
  duration: { type: String, required: [true, 'Please add duration (e.g., 3 Days)'] },
  price: { type: Number, required: [true, 'Please add a price'], default: 0 },
  groupSize: { type: Number, required: [true, 'Please add group size'], default: 1 },
  image: { type: String, required: [true, 'Please upload a tour image'] },
  mapUrl: { type: String },

  // --- GraphRAG / AI Features ---
  categories: [{ type: String }], // e.g. ["Adventure", "Cultural", "Wildlife"]
  activities: [{ type: String }], // e.g. ["Hiking", "Photography", "Surfing"]
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'], default: 'Easy' },

  reviews: [reviewSchema],
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const Tour = mongoose.models.Tour || mongoose.model("Tour", tourSchema);
export default Tour;