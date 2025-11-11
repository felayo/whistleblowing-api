// controllers/reportController.js
import asyncHandler from "express-async-handler";
import crypto from "crypto";
import Report from "../models/Report.js";
import AuditLog from "../models/AuditLog.js";
import Category from "../models/Category.js";
import Agency from "../models/Agency.js";

// @desc    Create new report
// @route   POST /api/reports
// @access  Public (anonymous/confidential whistleblowers)
export const createReport = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    location,
    reporterType,
    reporterName,
    reporterEmail,
    reporterPhone,
  } = req.body;

  // ✅ Basic validation
  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: "Title and description are required fields.",
    });
  }

  if (!["anonymous", "confidential"].includes(reporterType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid reporter type. Must be 'anonymous' or 'confidential'.",
    });
  }

  // ✅ Anonymous → reject personal info
  if (
    reporterType === "anonymous" &&
    (reporterName || reporterEmail || reporterPhone)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Anonymous reports cannot include name, email, or phone information.",
    });
  }

  // ✅ Confidential → must include name + email
  if (reporterType === "confidential") {
    if (!reporterName || !reporterEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Confidential reports must include reporter name and email address.",
      });
    }
  }

  // ✅ Default category & agency
  const defaultCategory = await Category.findOne({ name: "uncategorised" });
  const defaultAgency = await Agency.findOne({ name: "unassigned" });

  // ✅ Handle uploaded files (from S3)
  let evidenceFiles = [];
  if (req.files && req.files.length > 0) {
    evidenceFiles = req.files.map((file) => ({
      filePath: file.location, // URL from S3
      fileType: file.mimetype,
      fileName: file.originalname,
      uploadedAt: new Date(),
    }));
  }

  // ✅ Create report
  const report = await Report.create({
    title,
    description,
    location,
    reporterType,
    reporterName,
    reporterEmail,
    reporterPhone,
    category: defaultCategory ? defaultCategory._id : null,
    agencyAssigned: defaultAgency ? defaultAgency._id : null,
    evidenceFiles,
  });

  // ✅ Log action
  await AuditLog.create({
    action: "REPORT_CREATED",
    description: `Report created with caseID: ${report.caseID}`,
    targetReport: report._id,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "Report submitted successfully",
    data: report.getPublicData(),
    casePassword: report._plainPassword, // temporary plain password
  });
});

// @desc    Retrieve report using password
// @route   GET /api/report/:password/follow-up
// @access  Public (with password)
export const getReportByPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required.",
    });
  }

  // Step 1: Generate lookup key
  const passwordKey = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  // Step 2: Find report and populate category & agency names
  const report = await Report.findOne({ passwordKey })
    .select("+password") // include hidden password for comparison
    .populate("category", "name description") // only include these fields
    .populate("agencyAssigned", "name description");

  if (!report) {
    return res.status(404).json({
      success: false,
      message: "No report found for this password.",
    });
  }

  // Step 3: Compare bcrypt password for validation
  const isMatch = await report.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid password.",
    });
  }

  // Step 4: Return cleaned report data
  res.status(200).json({
    success: true,
    message: "Report retrieved successfully.",
    data: report.getPublicData(), // this already removes sensitive info
  });
});

//Loops through all reports to find a match
//This is inefficient and should be optimized in the future
/*export const getReportByPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required.",
    });
  }

  // Retrieve all reports (can be optimized later)
  const reports = await Report.find();

  let matchedReport = null;

  for (const report of reports) {
    const isMatch = await report.matchPassword(password);
    if (isMatch) {
      matchedReport = report;
      break;
    }
  }

  if (!matchedReport) {
    return res.status(404).json({
      success: false,
      message: "No report found for this password.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Report retrieved successfully.",
    data: matchedReport.getPublicData(),
  });
});
*/

// @desc    Whistle-blower adds a message/update using password
// @route   POST /api/reports/message
// @access  Public (via password)
export const addWhistleblowerMessage = asyncHandler(async (req, res) => {
  const { password, message } = req.body;

  if (!password || !message) {
    return res.status(400).json({
      success: false,
      message: "Password and message are required.",
    });
  }

  // 🔍 Find report by password
  const reports = await Report.find().select("+password");

  // Loop to find the one that matches password
  let matchedReport = null;
  for (const report of reports) {
    const isMatch = await report.matchPassword(password);
    if (isMatch) {
      matchedReport = report;
      break;
    }
  }

  if (!matchedReport) {
    return res.status(401).json({
      success: false,
      message: "Invalid password. Report not found.",
    });
  }

  // ✅ Handle uploaded files (if any)
  let evidenceFiles = [];
  if (req.files && req.files.length > 0) {
    evidenceFiles = req.files.map((file) => ({
      filePath: file.location,
      fileType: file.mimetype.split("/")[0], // e.g. image, video, application
      fileName: file.originalname,
      uploadedAt: new Date(),
    }));
    // Push to evidenceFiles array
    matchedReport.evidenceFiles.push(...evidenceFiles);
  }

  // 📝 Add message to comments thread
  matchedReport.comments.push({
    role: "reporter",
    message,
    createdAt: new Date(),
  });

  await matchedReport.save();

  // 🧾 Log action
  await AuditLog.create({
    action: "REPORT_UPDATED_BY_REPORTER",
    description: `Whistle-blower added message to case ${matchedReport.caseID}`,
    targetReport: matchedReport._id,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "Message added successfully.",
    data: {
      comments: matchedReport.comments,
      evidenceFiles: matchedReport.evidenceFiles,
    },
  });
});
