import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Tour from '../models/Tour.js';
import Vehicle from '../models/Vehicle.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import { randomInt } from 'node:crypto';
import { authenticateGoogle } from '../utils/googleAuthentication.js';



// store temporary OTP
const otpStore = new Map();

/**
 * @desc    Send OTP to Email
 * @route   POST /api/users/send-otp
 * @access  Public
 */
export const sendOTP = asyncHandler(async (req, res) => {
  const { email, isUpdate } = req.body;

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    res.status(400);
    throw new Error('Email is required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  // Preventing multiple OTP requests per email
  const lastRequest = otpStore.get(`${normalizedEmail}_time`);
  if (lastRequest && Date.now() - lastRequest < 30000) {
    res.status(429);
    throw new Error('Please wait 30 seconds before requesting another OTP');
  }

  const userExists = await User.findOne({ email: normalizedEmail });

  if (!isUpdate && userExists) {
    res.status(400);
    throw new Error('User already exists');
  }



  const otp = randomInt(100000, 1000000).toString();
  
  // OTP store (10 minutes expiry)
  otpStore.set(normalizedEmail, {
    otp,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0
  });
  
  // Last request time store 
  otpStore.set(`${normalizedEmail}_time`, Date.now());

  // OTP cleanup function
  cleanupExpiredOTPs();

  const mailOptions = {
    from: `"Lak Travelers" <${process.env.EMAIL_USER}>`,
    to: normalizedEmail,
    subject: 'Verification Code - Lak Travelers',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #1a73e8; text-align: center;">Lak Travelers Verification</h2>
        <p style="text-align: center;">Your verification code is:</p>
        <div style="background: #f1f3f4; padding: 15px; text-align: center; border-radius: 8px;">
          <h1 style="margin: 0; letter-spacing: 8px; color: #333; font-size: 32px;">${otp}</h1>
        </div>
        <p style="text-align: center; color: #777; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    // Production mode - email 
    await sendEmail(mailOptions);
    console.log(`✅ OTP sent successfully to: ${normalizedEmail}`);
    
    res.status(200).json({ 
      message: 'OTP sent successfully!',
      email: normalizedEmail
    });
    
  } catch (error) {
    console.error('Verification email delivery failed');
    
    otpStore.delete(normalizedEmail);
    // Production mode error throw 
    res.status(503);
    throw new Error('Unable to send verification email. Please try again later.');
  }
});

/**
 * @desc    Verify OTP and register user
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, otp } = req.body;

  if (!name?.trim() || !email?.trim() || typeof password !== 'string' || password.length < 8) {
    res.status(400);
    throw new Error('Name, email, and a password of at least 8 characters are required');
  }
  const safeRole = role === 'vendor' ? 'vendor' : 'user';

  const normalizedEmail = email.trim().toLowerCase();
  const otpData = otpStore.get(normalizedEmail);

  // OTP validation
  if (!otpData) {
    res.status(400);
    throw new Error('OTP not found. Please request a new OTP.');
  }

  if (otpData.expires < Date.now()) {
    otpStore.delete(normalizedEmail);
    res.status(400);
    throw new Error('OTP has expired. Please request a new OTP.');
  }

  // Increment attempts
  otpData.attempts += 1;
  if (otpData.attempts > 5) {
    otpStore.delete(normalizedEmail);
    res.status(400);
    throw new Error('Too many attempts. Please request a new OTP.');
  }

  if (otpData.otp !== otp) {
    otpStore.set(normalizedEmail, otpData);
    res.status(400);
    throw new Error('Invalid OTP. Please check and try again.');
  }

  // OTP verified successfully - create user
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: safeRole,
    isApproved: safeRole !== 'vendor',
  });

  if (user) {
    // Remove OTP after successful verification
    otpStore.delete(normalizedEmail);
    
    // Generate token
    const token = generateToken(res, user._id);
    
    // Send welcome email (optional)
    if (process.env.NODE_ENV === 'production') {
      try {
        
        await sendEmail({
          from: `"Lak Travelers" <${process.env.EMAIL_USER}>`,
          to: normalizedEmail,
          subject: 'Welcome to Lak Travelers!',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #1a73e8;">Welcome to Lak Travelers, ${name}!</h2>
              <p>Your account has been successfully created.</p>
              <p>Start exploring amazing tours, hotels, and vehicles in Sri Lanka.</p>
              <p><a href="${process.env.FRONTEND_URL}" style="background: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Explore Now</a></p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Welcome email failed:', emailError.message);
      }
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      token: token,
      message: 'Registration successful!'
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user && (await user.matchPassword(password))) {
    // Check if vendor is approved
    if (user.role === 'vendor' && !user.isApproved) {
      res.status(403);
      throw new Error('Your vendor account is pending approval. Please contact support.');
    }

    // Check if user is banned
    if (user.isBanned || user.isDisabled) {
      res.status(403);
      throw new Error('Your account has been suspended. Please contact support.');
    }

    const token = generateToken(res, user._id);
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      profileImage: user.profileImage,
      token: token,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

/**
 * @desc    Google Social Login
 * @route   POST /api/users/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req, res) => {
  try {
    const user = await authenticateGoogle(req.body);
    const token = generateToken(res, user._id, user.role);
    res.status(200).json({ _id: user._id, name: user.name, email: user.email, role: user.role,
      isApproved: user.isApproved, profileImage: user.profileImage || user.avatar || '', token });
  } catch (error) {
    // Never send/log Google library exceptions: they may include credential details.
    const status = error.statusCode || 503;
    res.status(status).json({ message: error.statusCode ? error.message : 'Google sign-in is temporarily unavailable. Please try again.',
      ...(error.code === 'GOOGLE_LINK_REQUIRED' ? { code: error.code } : {}) });
  }
});

/**
 * @desc    Logout user
 * @route   POST /api/users/logout
 * @access  Private
 */
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', { 
    httpOnly: true, 
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate({
      path: 'bookings',
      options: { sort: { createdAt: -1 }, limit: 10 }
    });

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // If email is being changed, verify with OTP
  if (req.body.email && req.body.email !== user.email) {
    const normalizedEmail = req.body.email.trim().toLowerCase();
    const emailExists = await User.findOne({ email: normalizedEmail });
    
    if (emailExists) {
      res.status(400);
      throw new Error('Email already in use');
    }
    
    // For email change, require OTP verification
    if (!req.body.emailChangeOTP) {
      res.status(400);
      throw new Error('OTP required for email change');
    }
    
    const otpData = otpStore.get(normalizedEmail);
    if (!otpData || otpData.otp !== req.body.emailChangeOTP) {
      res.status(400);
      throw new Error('Invalid OTP for email change');
    }
    
    user.email = normalizedEmail;
    otpStore.delete(normalizedEmail); // Remove used OTP
  }

  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  if (req.body.profileImage) user.profileImage = req.body.profileImage;
  
  // Only update password if provided
  if (req.body.password && req.body.password.trim() !== '') {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();
  
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    role: updatedUser.role,
    profileImage: updatedUser.profileImage,
    message: 'Profile updated successfully'
  });
});

/**
 * @desc    Update Vendor Profile
 * @route   PUT /api/users/vendor-profile
 * @access  Private (Vendor)
 */
export const updateVendorProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Solution: Destructure incoming names (businessName, address, phone) 
  // from frontend to match expected names on the backend.
  const { 
    businessName, 
    address, 
    phone, 
    serviceType, 
    registrationNumber, 
    description,
    hotelStarRating,
    vehicleFleetSize,
    guideLanguages,
    experienceYears,
    profileImage,
    idFront,
    idBack 
  } = req.body;
  
  // Validation - Checks frontend 'address' and 'phone' fields here.
  if (!businessName || !address || !phone) {
    res.status(400);
    throw new Error('Business name, address, and phone are required');
  }

  // Database mapping storage strategy
  user.vendorDetails = { 
    ...user.vendorDetails, 
    businessName: businessName.trim(),
    businessAddress: address.trim(), // Frontend address -> Backend businessAddress
    businessPhone: phone.trim(),     // Frontend phone -> Backend businessPhone
    businessRegNo: registrationNumber?.trim() || '',
    serviceType: serviceType,
    description: description,
    hotelStarRating: hotelStarRating,
    vehicleFleetSize: vehicleFleetSize,
    guideLanguages: guideLanguages,
    experienceYears: experienceYears,
    profileImage: profileImage,
    idDocuments: {
      front: idFront,
      back: idBack
    },
    updatedAt: Date.now()
  };
  
  // Vendor re-approval strategy upon profile modification
  user.role = 'vendor';
  user.isApproved = false;
  user.approvalStatus = 'pending';

  const updatedUser = await user.save();
  
  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    isApproved: updatedUser.isApproved,
    vendorDetails: updatedUser.vendorDetails,
    message: 'Vendor profile updated. Requires admin approval.'
  });
});

/**
 * @desc    Admin: Get all pending vendors
 * @route   GET /api/users/pending-vendors
 * @access  Private/Admin
 */
export const getPendingVendors = asyncHandler(async (req, res) => {
  const vendors = await User.find({ 
    role: 'vendor', 
    isApproved: false 
  }).select('-password').sort({ createdAt: -1 });
  
  res.json(vendors);
});

/**
 * @desc    Admin: Approve vendor
 * @route   PUT /api/users/approve-vendor/:id
 * @access  Private/Admin
 */
export const approveVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findById(req.params.id);
  
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  if (vendor.role !== 'vendor') {
    res.status(400);
    throw new Error('User is not a vendor');
  }

  vendor.isApproved = true;
  vendor.approvalStatus = 'approved';
  vendor.approvedAt = Date.now();
  vendor.approvedBy = req.user._id;

  await vendor.save();

  // Send approval email
  try {

    await sendEmail({
      from: `"Lak Travelers" <${process.env.EMAIL_USER}>`,
      to: vendor.email,
      subject: 'Vendor Account Approved - Lak Travelers',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1a73e8;">Congratulations, ${vendor.name}!</h2>
          <p>Your vendor account has been approved.</p>
          <p>You can now start adding your hotels, tours, and vehicles.</p>
          <p><a href="${process.env.FRONTEND_URL}/vendor/dashboard" style="background: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Approval email failed:', emailError.message);
  }

  res.json({ 
    message: 'Vendor approved successfully',
    vendor: {
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      businessName: vendor.vendorDetails?.businessName
    }
  });
});

/**
 * @desc    Admin: Reject vendor
 * @route   PUT /api/users/reject-vendor/:id
 * @access  Private/Admin
 */
export const rejectVendor = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const vendor = await User.findById(req.params.id);
  
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  if (vendor.role !== 'vendor') {
    res.status(400);
    throw new Error('User is not a vendor');
  }

  vendor.isApproved = false;
  vendor.approvalStatus = 'rejected';
  vendor.rejectionReason = rejectionReason || 'Application rejected';

  await vendor.save();

  // Send rejection email
  try {

    await sendEmail({
      from: `"Lak Travelers" <${process.env.EMAIL_USER}>`,
      to: vendor.email,
      subject: 'Vendor Application Update - Lak Travelers',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #d93025;">Vendor Application Update</h2>
          <p>Dear ${vendor.name},</p>
          <p>Your vendor application has been reviewed and unfortunately, we cannot approve it at this time.</p>
          ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          <p>You can update your profile and reapply.</p>
          <p>Contact support for more information.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Rejection email failed:', emailError.message);
  }

  res.json({ 
    message: 'Vendor rejected successfully',
    reason: rejectionReason
  });
});

/**
 * @desc    Admin: Create User
 * @route   POST /api/users/admin/create
 * @access  Private/Admin
 */
export const adminCreateUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, isApproved } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: role || 'user',
    isApproved: isApproved !== undefined ? isApproved : true,
    createdAt: Date.now(),
    createdBy: req.user._id
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isApproved: user.isApproved,
    message: 'User created successfully'
  });
});

/**
 * @desc    Admin: Update User
 * @route   PUT /api/users/admin/update/:id
 * @access  Private/Admin
 */
export const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent modifying super admin
  if (user.role === 'super-admin' && req.user.role !== 'super-admin') {
    res.status(403);
    throw new Error('Cannot modify super admin');
  }

  if (req.body.email && req.body.email !== user.email) {
    const normalizedEmail = req.body.email.trim().toLowerCase();
    const emailExists = await User.findOne({ 
      email: normalizedEmail, 
      _id: { $ne: user._id } 
    });
    
    if (emailExists) {
      res.status(400);
      throw new Error('Email already in use');
    }
    user.email = normalizedEmail;
  }

  user.name = req.body.name || user.name;
  user.role = req.body.role || user.role;
  user.isApproved = req.body.isApproved !== undefined ? req.body.isApproved : user.isApproved;
  user.isBanned = req.body.isBanned !== undefined ? req.body.isBanned : user.isBanned;
  
  if (req.body.vendorDetails) {
    user.vendorDetails = { ...user.vendorDetails, ...req.body.vendorDetails };
  }
  
  if (req.body.password && req.body.password.trim() !== '') {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();
  
  // Remove password from response
  const userResponse = updatedUser.toObject();
  delete userResponse.password;

  res.json({
    ...userResponse,
    message: 'User updated successfully'
  });
});

/**
 * @desc    Admin: Delete User
 * @route   DELETE /api/users/admin/delete/:id
 * @access  Private/Admin
 */
export const adminDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin' || user.role === 'super-admin') {
    res.status(400);
    throw new Error('Cannot delete admin users');
  }

  // Check if user has any bookings
  const hasBookings = await Booking.findOne({ user: user._id });
  if (hasBookings) {
    res.status(400);
    throw new Error('Cannot delete user with existing bookings');
  }

  await User.findByIdAndDelete(req.params.id);
  
  res.json({ 
    message: 'User deleted successfully',
    deletedUser: {
      _id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

/**
 * @desc    Admin: Get all users
 * @route   GET /api/users/admin/all
 * @access  Private/Admin
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  
  const query = {};
  
  if (role && role !== 'all') {
    query.role = role;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await User.countDocuments(query);
  
  res.json({
    users,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  });
});

/**
 * @desc    Admin: Get dashboard statistics
 * @route   GET /api/users/admin/stats
 * @access  Private/Admin
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  const [
    usersCount,
    vendorsCount,
    hotelsCount,
    toursCount,
    vehiclesCount,
    bookingsCount,
    confirmedBookings,
    pendingVendors
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'vendor', isApproved: true }),
    Hotel.countDocuments(),
    Tour.countDocuments(),
    Vehicle.countDocuments(),
    Booking.countDocuments({ status: { $ne: 'cancelled' } }),
    Booking.find({ status: 'confirmed' }),
    User.countDocuments({ role: 'vendor', isApproved: false })
  ]);

  const totalRevenue = confirmedBookings.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
  
  // Recent users (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });
  
  // Recent bookings (last 7 days)
  const recentBookings = await Booking.countDocuments({ 
    createdAt: { $gte: weekAgo },
    status: { $ne: 'cancelled' }
  });

  res.json({
    usersCount,
    vendorsCount,
    bookingsCount,
    hotelsCount,
    toursCount,
    vehiclesCount,
    totalRevenue,
    pendingVendors,
    recentUsers,
    recentBookings,
    avgBookingValue: bookingsCount > 0 ? totalRevenue / bookingsCount : 0
  });
});

/**
 * @desc    Request password reset OTP
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Generate reset token (OTP)
  const resetOTP = randomInt(100000, 1000000).toString();
  const resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes

  // Store reset token in user document
  user.resetPasswordToken = resetOTP;
  user.resetPasswordExpires = resetTokenExpiry;
  await user.save();

  // Send reset email
  try {

    await sendEmail({
      from: `"Lak Travelers" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: 'Password Reset Request - Lak Travelers',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1a73e8;">Password Reset Request</h2>
          <p>You requested to reset your password. Use the OTP below:</p>
          <div style="background: #f1f3f4; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="margin: 0; letter-spacing: 8px; color: #333; font-size: 32px;">${resetOTP}</h1>
          </div>
          <p style="color: #777; font-size: 12px;">This OTP will expire in 30 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ 
      message: 'Password reset OTP sent to your email',
      email: normalizedEmail
    });
  } catch (error) {
    console.error('Reset email error:', error.message);
    
    // Development mode: return OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`Reset OTP for ${normalizedEmail}: ${resetOTP}`);
      res.json({ 
        message: 'Password reset OTP generated',
        otp: resetOTP,
        email: normalizedEmail
      });
      return;
    }
    
    res.status(500);
    throw new Error('Failed to send reset email. Please try again.');
  }
});

/**
 * @desc    Reset password with OTP
 * @route   POST /api/users/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Email, OTP, and new password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ 
    email: normalizedEmail,
    resetPasswordToken: otp,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ 
    message: 'Password reset successful. You can now login with your new password.'
  });
});

/**
 * @desc    Change password (authenticated user)
 * @route   PUT /api/users/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current and new password are required');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify current password
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({ 
    message: 'Password changed successfully'
  });
});

// Helper function to clean up expired OTPs
function cleanupExpiredOTPs() {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expires && value.expires < now) {
      otpStore.delete(key);
    }
  }
}

// Schedule OTP cleanup every hour
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupExpiredOTPs, 60 * 60 * 1000); // 1 hour
}
