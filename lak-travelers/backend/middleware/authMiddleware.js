import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * @desc    Protect routes - Identify authenticated users
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. First, check if 'jwt' exists in Cookies
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } 
  // 2. If not in cookies, check the Authorization Header (Bearer Token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Splits 'Bearer' and the 'token' string
    token = req.headers.authorization.split(' ')[1];
  }

  // Ensure token exists and is not a "null" or "undefined" string
  if (token && token !== 'undefined' && token !== 'null') {
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'lak-travelers-api',
        audience: 'lak-travelers-client',
      });
      
      // Find the user and attach to the request (checking for both userId or id in payload)
      req.user = await User.findById(decoded.userId || decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next(); 
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token found');
  }
});

/**
 * @desc    Admin authorization - Identify users with admin role
 */
const admin = (req, res, next) => {
  if (req.user && ['admin', 'super-admin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

/**
 * @desc    Vendor authorization - Check for approved vendor status
 */
const vendor = (req, res, next) => {
  if (req.user && ['vendor', 'admin', 'super-admin'].includes(req.user.role)) {
    // If user is a vendor, check if they are admin-approved
    if (req.user.role === 'vendor' && !req.user.isApproved) {
      res.status(403);
      throw new Error('Vendor account not approved by admin yet');
    }
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a vendor');
  }
};

export { protect, admin, vendor };
