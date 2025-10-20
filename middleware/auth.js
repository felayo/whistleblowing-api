import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import ErrorResponse from "../utils/errorResponse.js";

// 🔒 Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ErrorResponse("Not authorized, token missing!", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      algorithms: ["HS256"],
    });

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new ErrorResponse("User no longer exists", 404));
    }

    if (!user.active) {
      return next(new ErrorResponse("Account is deactivated", 403));
    }

    req.user = user;
    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Token has expired, please log in again"
        : "Invalid authentication token";
    return next(new ErrorResponse(message, 401));
  }
});

// 🧩 Role-based access
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse("Not authenticated", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Access denied: '${req.user.role}' role not authorized`,
          403
        )
      );
    }

    next();
  };
};
