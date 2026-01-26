import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Please add a name'] },
    email: { type: String, required: [true, 'Please add an email'], unique: true, lowercase: true },
    password: { type: String, required: [true, 'Please add a password'], minlength: 6 },
    role: { type: String, enum: ['user', 'vendor', 'admin', 'super-admin'], default: 'user' },
    // Vendors are set to false by default until admin approval
    isApproved: { type: Boolean, default: true },
    
    // Vendor Details Schema - Updated to sync with Controller logic
    vendorDetails: {
      businessName: { type: String, default: "" },
      businessAddress: { type: String, default: "" }, 
      businessPhone: { type: String, default: "" },   
      serviceType: { type: String, enum: ['hotel', 'vehicle', 'tour', 'none'], default: 'none' },
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
      updatedAt: { type: Date, default: Date.now }
    },
    lastLogin: { type: Date },
    isBanned: { type: Boolean, default: false }
}, { timestamps: true });

/**
 * 🔐 Password Hashing Middleware
 * Automatically hashes the password before saving to the database.
 */
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return; 
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * 🔑 Instance method to compare entered password with hashed password
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if the model already exists to prevent OverwriteModelError in development
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;