import mongoose from 'mongoose';

const bookingSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },

    checkInDate: { type: Date }, 
    checkOutDate: { type: Date },
    tourDate: { type: Date },
    pickupDate: { type: Date },

    totalPrice: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'partially_paid'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['pay_on_arrival', 'online_payment', 'bank_transfer'], default: 'pay_on_arrival' },
    currency: { type: String, default: 'LKR' },

    status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled'], default: 'pending' },
    vendorFeedback: {
      problem: { type: String, default: "" },
      solution: { type: String, default: "" }
    },
    isWhatsAppNotified: { type: Boolean, default: false }
}, { timestamps: true });

bookingSchema.index({ hotel: 1, checkInDate: 1, checkOutDate: 1, status: 1 });
bookingSchema.index({ tour: 1, tourDate: 1, status: 1 });
bookingSchema.index({ vehicle: 1, pickupDate: 1, status: 1 });

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
