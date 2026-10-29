import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true });

const vehicleSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  type: { type: String, required: [true, 'Please add vehicle type (e.g. Car, Van, Bus)'] },
  vehicleModel: { type: String, required: [true, 'Please add vehicle model'] },
  licensePlate: { type: String, required: [true, 'Please add license plate'], unique: true },
  driverName: { type: String, required: [true, 'Please add driver name'] },
  capacity: { type: Number, required: [true, 'Please add capacity'] },
  pricePerDay: { type: Number, required: [true, 'Please add price per day'] },
  description: { type: String, required: [true, 'Please add a description'] },
  contactNumber: { type: String, required: [true, 'Please add a contact number'] },
  images: [{ type: String, required: true }],
  mapUrl: { type: String },

  // --- GraphRAG / AI Features ---
  amenities: [{ type: String }], // e.g. ["AC", "WiFi", "USB Charging"]
  driverLanguages: [{ type: String }], // e.g. ["English", "Sinhala", "Tamil"]
  isPrivate: { type: Boolean, default: true },

  reviews: [reviewSchema],
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;