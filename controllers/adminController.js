import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Report from "../models/Report.js";
import AuditLog from "../models/AuditLog.js";
import Agency from "../models/Agency.js";
import Category from "../models/Category.js";
import ErrorResponse from "../utils/errorResponse.js";

// @desc    Get All Unassigned Reports
// @route   GET /api/admin/unassigned
// @access  Private (Admin/Agency)
export const getUnassignedReports = asyncHandler(async (req, res) => {
  // Step 1: Get the default "No Agency Assigned" document
  const defaultAgency = await Agency.findOne({ name: "unassigned" });

  if (!defaultAgency) {
    return res.status(404).json({
      success: false,
      message: "Default 'unassigned' agency not found",
    });
  }

  // Step 2: Find all reports assigned to this default agency
  const unassignedReports = await Report.find({
    agencyAssigned: defaultAgency._id,
  })
    .populate("category", "name")
    .populate("agencyAssigned", "name")
    .sort({ createdAt: -1 });

  // Step 3: Respond
  res.status(200).json({
    success: true,
    count: unassignedReports.length,
    data: unassignedReports,
  });
});

// @desc    Get all reports (with pagination, search, and optional filter)
// @route   GET /api/admin/reports
// @access  Private (Admin/Agency only)

export const getAllReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, keyword = "", status } = req.query;

  // Build search conditions dynamically
  const searchFilter = {
    $or: [
      { caseID: { $regex: keyword, $options: "i" } },
      { title: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
  };

  // Optional filter by status (pending, in_progress, resolved, closed)
  if (status) {
    searchFilter.status = status;
  }

  // Count total reports (for pagination metadata)
  const total = await Report.countDocuments(searchFilter);

  // Fetch paginated reports
  const reports = await Report.find(searchFilter)
    .populate("category", "name")
    .populate("agencyAssigned", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalReports: total,
    count: reports.length,
    data: reports,
  });
});
/*
// @desc    Get all reports (assigned or unassigned)
// @route   GET /api/admin/reports
// @access  Private (Admin/Agency only)
export const getAllReports = asyncHandler(async (req, res) => {
  // Optionally, you could restrict access based on user role
  // e.g. if (req.user.role !== 'admin' && req.user.role !== 'agency') return res.status(403).json({ message: 'Unauthorized' });

  const reports = await Report.find()
    .populate("category", "name")
    .populate("agencyAssigned", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports,
  });
});
*/

// @desc    Get a single report by ID (for Admin)
// @route   GET /api/admin/reports/:id
// @access  Private (Admin only)
export const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid report ID format.",
    });
  }

  // Fetch the report and populate references
  const report = await Report.findById(id)
    .populate("category", "name description")
    .populate("agencyAssigned", "name description email phone");

  if (!report) {
    return res.status(404).json({
      success: false,
      message: "Report not found.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Report retrieved successfully.",
    data: report,
  });
});

// @desc    Update report category (Admin only)
// @route   PATCH /api/admin/reports/:id/category
export const updateReportCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { categoryId } = req.body;

  const report = await Report.findById(id);
  if (!report)
    return res
      .status(404)
      .json({ success: false, message: "Report not found" });

  const category = await Category.findById(categoryId);
  if (!category)
    return res
      .status(404)
      .json({ success: false, message: "Category not found" });

  report.category = category._id;
  await report.save();

  await AuditLog.create({
    action: "CATEGORY_ASSIGNED",
    description: `Category '${category.name}' assigned to report ${report.caseID}`,
    targetReport: report._id,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "Category assigned successfully",
    data: await report.populate("category agencyAssigned"),
  });
});

// @desc    Assign report to an agency (Admin only)
// @route   PATCH /api/admin/reports/:id/assign
export const assignReportToAgency = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { agencyId } = req.body;

  const report = await Report.findById(id);
  if (!report)
    return res
      .status(404)
      .json({ success: false, message: "Report not found" });

  const agency = await Agency.findById(agencyId);
  if (!agency)
    return res
      .status(404)
      .json({ success: false, message: "Agency not found" });

  report.agencyAssigned = agency._id;
  await report.save();

  await AuditLog.create({
    action: "AGENCY_ASSIGNED",
    description: `Report ${report.caseID} assigned to agency '${agency.name}'`,
    targetReport: report._id,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "Agency assigned successfully",
    data: await report.populate("category agencyAssigned"),
  });
});

// @desc    Update report status
// @route   PATCH /api/reports/:id/status
// @access  Private (Admin or Agency)
export const updateReportStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid report ID." });
  }

  const allowedStatuses = ["pending", "under review", "resolved", "closed"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
    });
  }

  // Fetch the report first so we can modify logic manually
  const report = await Report.findById(id);

  if (!report) {
    return res
      .status(404)
      .json({ success: false, message: "Report not found." });
  }
  // Business Logic for isResolved flag
  if (status === "resolved") {
    report.isResolved = true; // mark resolved permanently
  } else if (status === "closed") {
    // DO NOT MODIFY isResolved
    // If unresolved case is closed, isResolved remains false
  } else {
    // pending or under review → reopened
    report.isResolved = false;
  }
  // Update main status
  report.status = status;

  await report.save();

  await report.populate("category");
  await report.populate("agencyAssigned");

  // Audit Trail
  await AuditLog.create({
    action: "STATUS_UPDATED",
    description: `Status of report ${report.caseID} changed to '${status}'`,
    targetReport: report._id,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "Report status updated successfully.",
    data: report,
  });
});

/**
 * @desc    Add follow-up message to a report (Admin)
 * @route   POST /api/reports/:id/messages
 * @access  Private (Admin)
 */
export const addAdminMessage = asyncHandler(async (req, res, next) => {
  const { reportId } = req.params;
  const { message } = req.body;

  // 1️⃣ Validate report
  const report = await Report.findById(reportId);
  if (!report) {
    return next(new ErrorResponse("Report not found.", 404));
  }

  // 2️⃣ Validate message
  if (!message) {
    return next(new ErrorResponse("Message content is required.", 400));
  }

  // 📝 Add admin message with timestamp
  report.comments.push({
    role: "admin",
    message,
    author: req.user?.name || "System Admin",
    createdAt: new Date(),
  });

  await report.save();

  // 🧾 Log admin action
  await AuditLog.create({
    action: "REPORT_UPDATED_BY_ADMIN",
    description: `Admin added message to case ${report.caseID}`,
    targetReport: report._id,
    user: req.user?._id,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "Admin message added successfully.",
    data: report.comments,
  });
});

// @desc    Create new category
// @route   POST /api/admin/categories
// @access  Private (Admin only)
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Validation
  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Category name is required.",
    });
  }

  // Check for duplicate (case-insensitive)
  const existing = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Category with this name already exists.",
    });
  }

  // Create category
  const category = await Category.create({
    name,
    description: description || "",
  });

  // Log the action
  await AuditLog.create({
    action: "CATEGORY_CREATED",
    description: `Category '${name}' created.`,
    targetReport: null,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully.",
    data: category,
  });
});

// @desc    Create new agency
// @route   POST /api/admin/agencies
// @access  Private (Admin only)
export const createAgency = asyncHandler(async (req, res) => {
  const { name, description, contactEmail, contactPhone } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Agency name is required.",
    });
  }

  // Check for duplicate
  const existing = await Agency.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Agency with this name already exists.",
    });
  }

  const agency = await Agency.create({
    name,
    description: description || "",
    contactEmail,
    contactPhone,
  });

  await AuditLog.create({
    action: "AGENCY_CREATED",
    description: `Agency '${name}' created.`,
    targetReport: null,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "Agency created successfully.",
    data: agency,
  });
});

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private (Admin)
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });

  if (!categories || categories.length === 0) {
    return res.status(404).json({ message: "No categories found" });
  }

  res.status(200).json(categories);
});

// @desc    Get all agencies
// @route   GET /api/admin/agencies
// @access  Private (Admin)
export const getAllAgencies = asyncHandler(async (req, res) => {
  const agencies = await Agency.find().sort({ createdAt: -1 });

  if (!agencies || agencies.length === 0) {
    return res.status(404).json({ message: "No agencies found" });
  }

  res.status(200).json(agencies);
});

// @desc    Delete a category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin)
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID format.",
    });
  }

  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found.",
    });
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category deleted successfully.",
  });
});

// @desc    Delete an agency
// @route   DELETE /api/admin/agencies/:id
// @access  Private (Admin)
export const deleteAgency = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid agency ID format.",
    });
  }

  const agency = await Agency.findById(id);

  if (!agency) {
    return res.status(404).json({
      success: false,
      message: "Agency not found.",
    });
  }

  await agency.deleteOne();

  res.status(200).json({
    success: true,
    message: "Agency deleted successfully.",
  });
});
