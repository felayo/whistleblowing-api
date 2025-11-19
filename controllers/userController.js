import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Agency from "../models/Agency.js";
import ErrorResponse from "../utils/errorResponse.js";
import bcrypt from "bcryptjs";

// @desc    Create a new user (admin/agency)
// @route   POST /api/admin/users
// @access  Private (Admin only)
export const createUser = asyncHandler(async (req, res) => {
  const { email, username, password, role, agencyId, firstname, lastname, phone } = req.body;

  // Validate required fields
  if (!email || !username || !password) {
    return res.status(400).json({
      success: false,
      message: "Email, username, and password are required",
    });
  }

  // Ensure only Super Admin can create users
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only Super Admins can create new users",
    });
  }

  // Ensure role is valid
  const validRoles = ["admin", "agency"];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role specified. Must be either admin or agency.",
    });
  }

  // Prevent multiple admins
  if (role === "admin") {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "An admin user already exists",
      });
    }
  }

  // Create new user
  const newUser = await User.create({
    email,
    username,
    password,
    firstname,
    lastname,
    phone,
    role: role || "agency",
  });

  // 🔗 If user is an agency staff, associate with the selected agency
  if (newUser.role === "agency" && agencyId) {
    const agency = await Agency.findById(agencyId);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }
    // Assign agency to user
    newUser.agency = agencyId;
    await newUser.save();
    // Add the user to the agency’s users array
    agency.users.push(newUser._id);
    await agency.save();
  }

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: {
      id: newUser._id,
      email: newUser.email,
      username: newUser.username,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      phone: newUser.phone,
      createdAt: newUser.createdAt,
      role: newUser.role,
      agencyAssigned: agencyId || null,
      active: newUser.active,
    },
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate("agency", "name").lean();
  res.status(200).json({
    success: true,
    message: "Fetched all users successfully",
    count: users.length,
    data: users,
  });
});

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate("agency", "name").lean();
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Fetched user successful",
    data: user,
  });
});

// @desc    Update user by ID
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
export const updateUser = asyncHandler(async (req, res, next) => {
  const updates = { ...req.body };

  // Prevent role tampering or password updates here
  delete updates.password;
  delete updates._id;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // Prevent removing last admin
  if (user.role === "admin" && updates.role === "agency") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 1) {
      return next(new ErrorResponse("Cannot downgrade the only admin", 403));
    }
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select("username email role active createdAt");

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

// @desc    Delete user by ID
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // Prevent deleting the only admin
  if (user.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 1) {
      return next(
        new ErrorResponse("Cannot delete the only admin account", 403)
      );
    }
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
