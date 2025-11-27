import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import ErrorResponse from "../utils/errorResponse.js";
import User from "../models/User.js";

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Account not found", 401));
  }

  if (!user.active) {
    return next(new ErrorResponse("Account is inactive. Contact admin.", 403));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  sendTokenResponse(user, 200, res);
});

export const refresh = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const foundUser = await User.findOne({ email: decoded.email }).exec();
    if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

    // Generate new access token
    const token = jwt.sign(
      { id: foundUser._id, role: foundUser.role, email: foundUser.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_JWT_EXPIRE }
    );

    // Return both token + user info for persistent login
    res.json({
      token,
      user: {
        id: foundUser._id,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
      },
    });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(403).json({ message: "Forbidden" });
  }
});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse("Please provide both current and new password", 400));
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.matchPassword(currentPassword))) {
    return next(new ErrorResponse("Password is incorrect", 401));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});


export const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ success: true, message: "Cookie cleared" });
};

// Get token from model, create cookie, and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Generate short-lived access token (for API authorization)
  const token = user.getSignedJwtToken();

  // Generate refresh token (for silent re-authentication)
  const refreshToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_JWT_EXPIRE, // e.g. "7d"
    }
  );

  // Cookie options for refresh token
  const options = {
    httpOnly: true,       // Prevent JS access (helps stop XSS attacks)
    secure: true,         // Use HTTPS only
    sameSite: "None",     // Allow cross-site (important if frontend is on a different domain)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (adjust to match REFRESH_JWT_EXPIRE)
  };

  // Send cookie and JSON response
  res
    .status(statusCode)
    .cookie("jwt", refreshToken, options)
    .json({
      success: true,
      token, // access token
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
};
