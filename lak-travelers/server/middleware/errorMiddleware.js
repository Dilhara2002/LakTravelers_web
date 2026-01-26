/**
 * @desc    Handle 404 errors for URLs that do not match any existing routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passes the error to the errorHandler middleware below
};

/**
 * @desc    Global error handler to manage all exceptions and return consistent JSON responses
 * @important All 4 parameters (err, req, res, next) are required for Express to recognize this as an Error Middleware.
 */
const errorHandler = (err, req, res, next) => {
  // If the status code is still 200, default it to 500 (Internal Server Error)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle specific MongoDB invalid ObjectId errors (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Log error details for server-side debugging
  console.error(`🚨 Backend Error (${statusCode}): ${message}`);
  console.error(err.stack); // Logs the full error stack for tracing

  // Respond to the frontend with a structured JSON error object
  res.status(statusCode).json({
    success: false,
    message: message,
    // Hide the stack trace in production (e.g., Vercel/Render) for security purposes
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };