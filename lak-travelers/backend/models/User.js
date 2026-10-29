import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a name'] },

  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true
  },

  // Changed: not required for social login users
  password: {
    type: String,
    minlength: 6,
    default: null
  },

  role: {
    type: String,
    enum: ['user', 'vendor', 'admin', 'super-admin'],
    default: 'user'
  },

  isApproved: { type: Boolean, default: true },

  // =========================
  // SOCIAL LOGIN FIELDS
  // =========================
  googleId: {
    type: String,
    default: null
  },

  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },

  avatar: {
    type: String,
    default: ''
  },

  // =========================
  // VENDOR DETAILS
  // =========================
  vendorDetails: {
    businessName: { type: String, default: "" },
    businessAddress: { type: String, default: "" },
    businessPhone: { type: String, default: "" },
    serviceType: {
      type: String,
      enum: ['hotel', 'vehicle', 'tour', 'none'],
      default: 'none'
    },
    registrationNumber: { type: String, default: "" },
    description: { type: String, default: "" },
    hotelStarRating: { type: String, default: "" },
    vehicleFleetSize: { type: String, default: "" },
    guideLanguages: { type: String, default: "" },
    experienceYears: { type: String, default: "" },
    profileImage: { type: String, default: "" },

    idDocuments: {
      front: { type: String, default: "" },
      back: { type: String, default: "" }
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },

  lastLogin: { type: Date },

  isBanned: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

/**
 * Password Hashing Middleware
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compare Password
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User =
  mongoose.models.User ||
  mongoose.model('User', userSchema);

export default User;
