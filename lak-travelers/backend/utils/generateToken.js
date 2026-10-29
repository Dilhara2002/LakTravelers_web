import jwt from 'jsonwebtoken';

/**
 * @desc    Generate a JWT token, set it as an HTTP-Only Cookie, and return the token
 * @param   {Object} res - Express response object
 * @param   {String} userId - User's MongoDB ObjectID
 * @param   {String} role - User role (defaults to 'user')
 */
const generateToken = (res, userId, role = 'user') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  // 1. Create the token (Payload includes userId and role)
  const tokenPayload = { 
    userId, 
    role 
  };
  
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: '30d',
    issuer: 'lak-travelers-api',
    audience: 'lak-travelers-client'
  });

  // 2. Set as an HTTP-Only Cookie for the Client (Browser)
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Cookie settings optimized for Vercel + Render.com deployments
  const cookieOptions = {
    httpOnly: true,    
    secure: isProduction, // True in production, false in development
    sameSite: isProduction ? 'none' : 'lax', // 'none' is required for cross-site cookies
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  };

  // Adjustments for local development on localhost
  if (isDevelopment) {
    cookieOptions.secure = false;
    cookieOptions.sameSite = 'lax';
  }

  // Set the primary secure JWT cookie
  res.cookie('jwt', token, cookieOptions);

  return token; 
};

/**
 * @desc    Verify a JWT token
 * @param   {String} token - JWT token string
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    
    // Specific JWT error handling
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    
    throw error;
  }
};

/**
 * @desc    Clear authentication cookies on logout
 * @param   {Object} res - Express response object
 */
export const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    expires: new Date(0), // Sets expiration to the past to delete the cookie
  };

  res.cookie('jwt', '', cookieOptions);
};

export default generateToken;
