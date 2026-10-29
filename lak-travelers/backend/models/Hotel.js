import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  image: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true });

const hotelSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: [true, 'Please add a hotel name'] },
  location: { type: String, required: [true, 'Please add a location'] },
  description: { type: String, required: [true, 'Please add a description'] },
  pricePerNight: { type: Number, required: [true, 'Please add price per night'], default: 0 },
  image: { type: String, required: [true, 'Please upload a hotel image'] },
  mapUrl: { type: String, required: [true, 'Please add a Google Maps URL'] },

  // --- GraphRAG / AI Features ---
  luxuryGrade: { type: String, enum: ['Budget', 'Standard', 'Luxury'], default: 'Standard' },
  veganOptions: { type: Boolean, default: false },
  wellness: [{ type: String }], // e.g. ["Yoga", "Spa", "Gym"]
  amenities: [{ type: String }], // e.g. ["Free WiFi", "Pool", "Beach Access"]

  reviews: [reviewSchema], 
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const Hotel = mongoose.models.Hotel || mongoose.model("Hotel", hotelSchema);
export default Hotel;