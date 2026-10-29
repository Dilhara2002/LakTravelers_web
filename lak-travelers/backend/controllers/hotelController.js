import asyncHandler from 'express-async-handler';
import Hotel from '../models/Hotel.js';

/**
 * @desc    Fetch all hotels (with search functionality)
 * @route   GET /api/hotels
 * @access  Public
 */

// use Dynamic Querying
const getHotels = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { location: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const hotels = await Hotel.find({ ...keyword }).sort({ createdAt: -1 });
  res.json(hotels);
});

/**
 * @desc    Create a new hotel
 * @route   POST /api/hotels
 * @access  Private (Vendor/Admin)
 */
const createHotel = asyncHandler(async (req, res) => {
  const { name, location, description, pricePerNight, image, mapUrl } = req.body;

  if (!name || !location || !description || !pricePerNight || !image || !mapUrl) {
    res.status(400);
    throw new Error('Please fill all fields');
  }

  // Handle image if it comes as an object from Cloudinary upload
  const finalImage = typeof image === 'object' ? image.image : image;

  const hotel = new Hotel({
    user: req.user._id, // Assign the logged-in user as the owner
    name,
    location,
    description,
    pricePerNight,
    image: finalImage,
    mapUrl,
  });

  const createdHotel = await hotel.save();
  res.status(201).json(createdHotel);
});

/**
 * @desc    Get hotel by ID
 * @route   GET /api/hotels/:id
 * @access  Public
 */
const getHotelById = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id).populate('user', 'name email');
  
  if (hotel) {
    res.json(hotel);
  } else {
    res.status(404);
    throw new Error('Hotel not found');
  }
});

/**
 * @desc    Update hotel details
 * @route   PUT /api/hotels/:id
 * @access  Private (Owner/Admin)
 */
const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);

  if (hotel) {
    // 🛡️ SECURITY CHECK: Is the logged-in user the owner or an admin?
    const isOwner = hotel.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(401);
      throw new Error('Not authorized. You can only edit your own listings.');
    }

    hotel.name = req.body.name || hotel.name;
    hotel.location = req.body.location || hotel.location;
    hotel.description = req.body.description || hotel.description;
    hotel.pricePerNight = req.body.pricePerNight || hotel.pricePerNight;
    
    if (req.body.image) {
      hotel.image = typeof req.body.image === 'object' ? req.body.image.image : req.body.image;
    }
    
    hotel.mapUrl = req.body.mapUrl || hotel.mapUrl;

    const updatedHotel = await hotel.save();
    res.json(updatedHotel);
  } else {
    res.status(404);
    throw new Error('Hotel not found');
  }
});

/**
 * @desc    Delete a hotel
 * @route   DELETE /api/hotels/:id
 * @access  Private (Owner/Admin)
 */
const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);

  if (hotel) {
    // 🛡️ SECURITY CHECK: Is the logged-in user the owner or an admin?
    const isOwner = hotel.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(401);
      throw new Error('Not authorized. You can only delete your own listings.');
    }

    await hotel.deleteOne();
    res.json({ message: 'Hotel removed successfully' });
  } else {
    res.status(404);
    throw new Error('Hotel not found');
  }
});

/**
 * @desc    Create a new review
 * @route   POST /api/hotels/:id/reviews
 * @access  Private
 */
const createHotelReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const hotel = await Hotel.findById(req.params.id);

  if (hotel) {
    const alreadyReviewed = hotel.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('You have already reviewed this hotel');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    hotel.reviews.push(review);
    hotel.numReviews = hotel.reviews.length;

    // Calculate Average Rating
    hotel.rating =
      hotel.reviews.reduce((acc, item) => item.rating + acc, 0) /
      hotel.reviews.length;

    await hotel.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Hotel not found');
  }
});

export {
  getHotels,
  createHotel,
  getHotelById,
  updateHotel,
  deleteHotel,
  createHotelReview,
};