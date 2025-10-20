import asyncHandler from "express-async-handler";
import Report from "../models/report.js";
import Agency from "../models/Agency.js";
import ErrorResponse from "../utils/errorResponse.js";
import AuditLog from "../models/AuditLog.js";

// @desc    Get all reports assigned to a particular agency
// @route   GET /api/agency/reports
// @access  Private (Agency only)
export const getAgencyReports = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, keyword = "", status } = req.query;

  // Ensure only agency users can access
  if (req.user.role !== "agency") {
    return next(new ErrorResponse("Access denied: Not an agency user", 403));
  }

  // ✅ Find the agency linked to this user
  const agency = await Agency.findOne({ users: req.user._id });
  if (!agency) {
    return next(new ErrorResponse("No agency linked to this user.", 404));
  }

  // ✅ Build dynamic search filter
  const searchFilter = {
    agencyAssigned: agency._id,
    $or: [
      { caseID: { $regex: keyword, $options: "i" } },
      { title: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
  };

  if (status) {
    searchFilter.status = status;
  }

  // ✅ Pagination
  const total = await Report.countDocuments(searchFilter);

  const reports = await Report.find(searchFilter)
    .populate("category", "name")
    .populate("agencyAssigned", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    agency: agency.name,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalReports: total,
    count: reports.length,
    data: reports,
  });
});

/**
 * @desc    Get a single report assigned to the logged-in agency
 * @route   GET /api/agency/reports/:id
 * @access  Private (Agency only)
 */
export const getAgencyReportById = asyncHandler(async (req, res, next) => {
  const reportId = req.params.id;
  const agencyUserId = req.user._id; // from protect middleware

  // Find the agency that this user belongs to
  const agency = await Agency.findOne({ users: agencyUserId });

  if (!agency) {
    return next(
      new ErrorResponse("You are not associated with any agency", 403)
    );
  }

  // Fetch the report and ensure it belongs to this agency
  const report = await Report.findOne({
    _id: reportId,
    agencyAssigned: agency._id,
  })
    .populate("category", "name")
    .populate("agencyAssigned", "name email phone");

  if (!report) {
    return next(
      new ErrorResponse("Report not found or not assigned to your agency", 404)
    );
  }

  res.status(200).json({
    success: true,
    data: report,
  });
});

// @desc    Add a follow-up message to a report (Agency)
// @route   POST /api/agency/:reportId/messages
// @access  Private (Agency only)
export const addAgencyMessage = asyncHandler(async (req, res, next) => {
  const { reportId } = req.params;
  const { message } = req.body;

  // 1️⃣ Validate report
  const report = await Report.findById(reportId).populate(
    "agencyAssigned",
    "name"
  );
  if (!report) {
    return next(new ErrorResponse("Report not found.", 404));
  }

  // 2️⃣ Validate message
  if (!message) {
    return next(new ErrorResponse("Message content is required.", 400));
  }

  // 3️⃣ Find the agency associated with the logged-in user
  const agency = await Agency.findOne({ users: req.user._id });
  if (!agency) {
    return next(new ErrorResponse("Agency not found for this user.", 404));
  }

  // 4️⃣ Ensure this report belongs to the agency
  if (
    !report.agencyAssigned ||
    report.agencyAssigned._id.toString() !== agency._id.toString()
  ) {
    return next(
      new ErrorResponse(
        "Unauthorized: This report is not assigned to your agency.",
        403
      )
    );
  }

  // 📝 Add agency message with timestamp
  report.comments.push({
    role: "agency",
    message,
    author: req.user?.username || "Agency Representative",
    createdAt: new Date(),
  });

  await report.save();

  // 🧾 Log agency action
  await AuditLog.create({
    action: "REPORT_UPDATED_BY_AGENCY",
    description: `Agency (${agency.name}) added message to case ${report.caseID}`,
    targetReport: report._id,
    user: req.user?._id,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "Agency message added successfully.",
    data: report.comments,
  });
});
