import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Tour from '../models/Tour.js';
import Vehicle from '../models/Vehicle.js';

const parseDate = (value, field) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    const error = new Error(`${field} must be a valid date`);
    error.statusCode = 400;
    throw error;
  }
  return date;
};

const calculateBookingPrice = async ({ hotel, tour, vehicle, checkInDate, checkOutDate, tourDate, pickupDate }) => {
  const selected = [hotel, tour, vehicle].filter(Boolean);
  if (selected.length !== 1) {
    const error = new Error('Select exactly one hotel, tour, or vehicle per booking');
    error.statusCode = 400;
    throw error;
  }

  if (hotel) {
    const listing = await Hotel.findById(hotel);
    if (!listing) throw Object.assign(new Error('Hotel not found'), { statusCode: 404 });
    const start = parseDate(checkInDate, 'Check-in date');
    const end = parseDate(checkOutDate, 'Check-out date');
    const nights = Math.ceil((end - start) / 86400000);
    if (nights < 1) throw Object.assign(new Error('Check-out must be after check-in'), { statusCode: 400 });
    const conflict = await Booking.exists({ hotel, status: { $in: ['pending', 'confirmed'] }, checkInDate: { $lt: end }, checkOutDate: { $gt: start } });
    if (conflict) throw Object.assign(new Error('Hotel is not available for the selected dates'), { statusCode: 409 });
    return { amount: listing.pricePerNight * nights, unitPrice: listing.pricePerNight, quantity: nights };
  }

  if (tour) {
    const listing = await Tour.findById(tour);
    if (!listing) throw Object.assign(new Error('Tour not found'), { statusCode: 404 });
    const date = parseDate(tourDate, 'Tour date');
    const conflict = await Booking.exists({ tour, tourDate: date, status: { $in: ['pending', 'confirmed'] } });
    if (conflict) throw Object.assign(new Error('Tour is not available on the selected date'), { statusCode: 409 });
    return { amount: listing.price, unitPrice: listing.price, quantity: 1 };
  }

  const listing = await Vehicle.findById(vehicle);
  if (!listing) throw Object.assign(new Error('Vehicle not found'), { statusCode: 404 });
  const date = parseDate(pickupDate, 'Pickup date');
  const conflict = await Booking.exists({ vehicle, pickupDate: date, status: { $in: ['pending', 'confirmed'] } });
  if (conflict) throw Object.assign(new Error('Vehicle is not available on the selected date'), { statusCode: 409 });
  return { amount: listing.pricePerDay, unitPrice: listing.pricePerDay, quantity: 1 };
};

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
    paymentMethod 
  } = req.body;

  if (paymentMethod && paymentMethod !== 'pay_on_arrival') {
    res.status(400);
    throw new Error('Online payments are not enabled yet. Please choose pay on arrival.');
  }

  const { amount, unitPrice, quantity } = await calculateBookingPrice({ hotel, tour, vehicle, checkInDate, checkOutDate, tourDate, pickupDate });

  const booking = new Booking({
    user: req.user._id,
    hotel,
    tour,
    vehicle,
    checkInDate,
    checkOutDate,
    tourDate,
    pickupDate,
    totalPrice: amount,
    unitPrice,
    quantity,
    status: 'pending',
    // ✅ Reserve Now, Pay Later 
    paymentMethod: 'pay_on_arrival',
    paymentStatus: 'unpaid'
  });

  const createdBooking = await booking.save();
  res.status(201).json(createdBooking);
});

/**
 * @desc    Update booking status (Vendor Action)
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.body; 
  const booking = await Booking.findById(req.params.id)
    .populate('hotel', 'user')
    .populate('tour', 'user')
    .populate('vehicle', 'user');

  if (booking) {
    const service = booking.hotel || booking.tour || booking.vehicle;
    const ownsService = service?.user?.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !ownsService) {
      res.status(403);
      throw new Error('You can only update bookings for your own listings');
    }

    const allowedStatuses = ['pending', 'confirmed', 'rejected', 'cancelled'];
    const allowedPaymentStatuses = ['unpaid', 'paid', 'partially_paid'];
    if (status && !allowedStatuses.includes(status.toLowerCase())) {
      res.status(400);
      throw new Error('Invalid booking status');
    }
    if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus.toLowerCase())) {
      res.status(400);
      throw new Error('Invalid payment status');
    }
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
