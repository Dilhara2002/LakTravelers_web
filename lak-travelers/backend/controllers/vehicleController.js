import asyncHandler from 'express-async-handler';
import Vehicle from '../models/Vehicle.js';

/**
 * @desc    Fetch all vehicles (with search functionality)
 * @route   GET /api/vehicles
 * @access  Public
 */
const getVehicles = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        vehicleModel: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const vehicles = await Vehicle.find({ ...keyword }).populate('user', 'name email').sort({ createdAt: -1 });
  res.json(vehicles);
});

/**
 * @desc    Get vehicle details by ID
 * @route   GET /api/vehicles/:id
 * @access  Public
 */
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id).populate('user', 'name email');

  if (vehicle) {
    res.json(vehicle);
  } else {
    res.status(404);
    throw new Error('Vehicle not found');
  }
});

/**
 * @desc    Create a new vehicle listing
 * @route   POST /api/vehicles
 * @access  Private (Vendor / Admin)
 */
const createVehicle = asyncHandler(async (req, res) => {
  // Check if Vendor is approved before allowing creation
  if (req.user.role === 'vendor' && !req.user.isApproved) {
    res.status(403);
    throw new Error('Your vendor account is not approved yet by admin');
  }

  const {
    driverName,
    vehicleModel,
    type,
    licensePlate,
    capacity,
    pricePerDay,
    description,
    contactNumber,
    images,
  } = req.body;

  // Validation
  if (!driverName || !vehicleModel || !type || !licensePlate || !capacity || !pricePerDay || !contactNumber || !images || images.length === 0) {
    res.status(400);
    throw new Error('Please fill all required fields and upload at least one image');
  }

  // Handle images if they come as objects from the upload route
  const processedImages = images.map(img => typeof img === 'object' ? img.image : img);

  const vehicle = new Vehicle({
    user: req.user._id,
    driverName,
    vehicleModel,
    type,
    licensePlate,
    capacity,
    pricePerDay,
    description,
    contactNumber,
    images: processedImages,
  });

  const createdVehicle = await vehicle.save();
  res.status(201).json(createdVehicle);
});

/**
 * @desc    Update vehicle details
 * @route   PUT /api/vehicles/:id
 * @access  Private (Owner / Admin)
 */
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (vehicle) {
    // 🛡️ SECURITY CHECK: Is the logged-in user the owner or an admin?
    const isOwner = vehicle.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(401);
      throw new Error('Not authorized. You can only update vehicles that you own.');
    }

    vehicle.driverName = req.body.driverName || vehicle.driverName;
    vehicle.vehicleModel = req.body.vehicleModel || vehicle.vehicleModel;
    vehicle.type = req.body.type || vehicle.type;
    vehicle.licensePlate = req.body.licensePlate || vehicle.licensePlate;
    vehicle.capacity = req.body.capacity || vehicle.capacity;
    vehicle.pricePerDay = req.body.pricePerDay || vehicle.pricePerDay;
    vehicle.description = req.body.description || vehicle.description;
    vehicle.contactNumber = req.body.contactNumber || vehicle.contactNumber;

    if (req.body.images) {
      vehicle.images = req.body.images.map(img => typeof img === 'object' ? img.image : img);
    }

    const updatedVehicle = await vehicle.save();
    res.json(updatedVehicle);
  } else {
    res.status(404);
    throw new Error('Vehicle not found');
  }
});

/**
 * @desc    Delete a vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Private (Owner / Admin)
 */
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (vehicle) {
    // 🛡️ SECURITY CHECK: Only Owner or Admin can delete
    const isOwner = vehicle.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (isOwner || isAdmin) {
      await vehicle.deleteOne();
      res.json({ message: 'Vehicle removed successfully' });
    } else {
      res.status(401);
      throw new Error('Not authorized. You can only delete vehicles that you own.');
    }
  } else {
    res.status(404);
    throw new Error('Vehicle not found');
  }
});

/**
 * @desc    Create new review
 * @route   POST /api/vehicles/:id/reviews
 * @access  Private
 */
const createVehicleReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const vehicle = await Vehicle.findById(req.params.id);

  if (vehicle) {
    const alreadyReviewed = vehicle.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('You have already reviewed this vehicle');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    vehicle.reviews.push(review);
    vehicle.numReviews = vehicle.reviews.length;
    
    // Calculate Average Rating
    vehicle.rating =
      vehicle.reviews.reduce((acc, item) => item.rating + acc, 0) /
      vehicle.reviews.length;

    await vehicle.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Vehicle not found');
  }
});

export {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  createVehicleReview,
};