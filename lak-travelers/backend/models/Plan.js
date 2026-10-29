import mongoose from 'mongoose';

const planSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    duration: { type: Number, required: true, min: 1, max: 30 },
    preferences: { type: String, trim: true, maxlength: 1000 },
    itinerary: { type: String, required: true, maxlength: 50000 },
  },
  { timestamps: true }
);

const Plan = mongoose.model('Plan', planSchema);
export default Plan;
