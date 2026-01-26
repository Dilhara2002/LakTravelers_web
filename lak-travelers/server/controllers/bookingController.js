import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking.js';

/**
 * @desc    Get logged in user bookings (Traveler side)
 * @route   GET /api/bookings/mybookings
 */
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('hotel', 'name image location') 
    .populate('tour', 'name image destinations')
    .populate('vehicle', 'vehicleModel images')
    .sort({ createdAt: -1 });

  res.json(bookings);
});

/**
 * @desc    Get Bookings relevant to the logged-in Vendor
 * @route   GET /api/bookings/vendor/my
 */
export const getMyVendorBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({})
    .populate('user', 'name email') 
    .populate({ path: 'hotel', match: { user: req.user._id } })
    .populate({ path: 'tour', match: { user: req.user._id } })
    .populate({ path: 'vehicle', match: { user: req.user._id } })
    .sort({ createdAt: -1 });

  const myBookings = bookings.filter(booking => 
    booking.hotel !== null || booking.tour !== null || booking.vehicle !== null
  );

  res.json(myBookings);
});

/**
 * @desc    Create a new Booking (With Reserve Now, Pay Later Logic)
 * @route   POST /api/bookings
 */
export const createBooking = asyncHandler(async (req, res) => {
  const { 
    hotel, tour, vehicle, 
    checkInDate, checkOutDate, 
    tourDate, pickupDate, 
    totalPrice,
    paymentMethod 
  } = req.body;

  if (!totalPrice) {
    res.status(400);
    throw new Error('Total price is required to complete the booking');
  }

  const booking = new Booking({
    user: req.user._id,
    hotel,
    tour,
    vehicle,
    checkInDate,
    checkOutDate,
    tourDate,
    pickupDate,
    totalPrice,
    status: 'pending',
    // ✅ Reserve Now, Pay Later 
    paymentMethod: paymentMethod || 'pay_on_arrival',
    paymentStatus: paymentMethod === 'online_payment' ? 'paid' : 'unpaid'
  });

  const createdBooking = await booking.save();
  res.status(201).json(createdBooking);
});

/**
 * @desc    Update booking status (Vendor Action)
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.body; 
  const booking = await Booking.findById(req.params.id);

  if (booking) {
    if (status) booking.status = status.toLowerCase();
    // (Paid/Unpaid) 
    if (paymentStatus) booking.paymentStatus = paymentStatus.toLowerCase();
    
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } else {
    res.status(404);
    throw new Error('Booking not found');
  }
});

/**
 * @desc    Cancel a booking (User Action)
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (booking) {
    if (booking.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to cancel this booking');
    }

    booking.status = 'cancelled';
    await booking.save();
    res.json({ message: 'Booking cancelled successfully' });
  } else {
    res.status(404);
    throw new Error('Booking not found');
  }
});

/**
 * @desc    Get all Bookings (Admin only)
 */
export const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({})
    .populate('user', 'name email')
    .populate({
      path: 'hotel tour vehicle',
      select: 'name vehicleModel user',
      populate: { path: 'user', select: 'name email' } 
    })
    .sort({ createdAt: -1 });
    
  res.json(bookings);
});