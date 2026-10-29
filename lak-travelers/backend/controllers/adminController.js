import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Tour from '../models/Tour.js';
import Vehicle from '../models/Vehicle.js';

/**
 * @desc    Get statistics for the Admin Dashboard
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getAdminStats = asyncHandler(async (req, res) => {
  // Log request for verification purposes
  console.log(`Admin Stats Requested by: ${req.user.name} (ID: ${req.user._id})`);

  try {
    // 1. Get total counts for all items
    // Using Promise.all allows all queries to execute in parallel for better performance.
    const [
      usersCount, 
      vendorsCount, 
      bookingsCount, 
      hotelsCount, 
      toursCount, 
      vehiclesCount
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'vendor' }), 
      Booking.countDocuments(),
      Hotel.countDocuments(),
      Tour.countDocuments(),
      Vehicle.countDocuments(),
    ]);

    // 2. Calculate Total Revenue
    // Performing the $sum within the database aggregation is significantly faster than manual calculation.
    const revenueStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" } 
        }
      }
    ]);

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

    // 3. Fetch Recent Bookings (Optional)
    // Displaying a few recent entries is useful for the primary dashboard view.
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    console.log("Admin Dashboard Stats Calculated Successfully ✅");

    res.status(200).json({
      success: true,
      stats: {
        usersCount,
        vendorsCount,
        bookingsCount,
        hotelsCount,
        toursCount,
        vehiclesCount,
        totalRevenue
      },
      recentBookings
    });

  } catch (error) {
    console.error("Error calculating admin stats:", error);
    res.status(500);
    throw new Error("An error occurred while retrieving statistics.");
  }
});

export { getAdminStats };