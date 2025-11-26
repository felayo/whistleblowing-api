import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getAgencyReports,
  getAgencyReportById,
  addAgencyMessage,
  updateAgencyReportStatus
} from "../controllers/agencyController.js";

const router = express.Router();

router.use(protect);
router.use(authorize("agency"));

/**
 * @swagger
 * tags:
 *   name: Agency
 *   description: Routes for agencies to view and manage assigned reports
 */

/**
 * @swagger
 * /agency/reports:
 *   get:
 *     summary: Get all reports assigned to the logged-in agency
 *     description: >
 *       Retrieves reports assigned to the agency that the logged-in user belongs to.  
 *       Supports keyword search (by caseID, title, or description), filtering by status, and pagination.
 *     tags: [Agency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search keyword for report title, case ID, or description.
 *         example: road
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, under review, resolved, closed]
 *         description: Filter reports by status.
 *         example: pending
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page.
 *         example: 10
 *     responses:
 *       200:
 *         description: Successfully fetched reports assigned to the agency.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 agency:
 *                   type: string
 *                   example: Lagos Waste Management Agency
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 totalReports:
 *                   type: integer
 *                   example: 25
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 670b1e7a3f2a4f4d1e1e8c29
 *                       caseID:
 *                         type: string
 *                         example: CASE-2025-001
 *                       title:
 *                         type: string
 *                         example: Damaged streetlight at Allen Avenue
 *                       description:
 *                         type: string
 *                         example: The streetlight near the roundabout has been down for weeks.
 *                       status:
 *                         type: string
 *                         example: under review
 *                       category:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Infrastructure
 *                       agencyAssigned:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Lagos Waste Management Agency
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-10-13T09:24:00.000Z
 *       403:
 *         description: Access denied — not an agency user.
 *       404:
 *         description: No agency linked to the logged-in user.
 */
router.get("/", getAgencyReports);

/**
 * @swagger
 * /agency/{id}:
 *   get:
 *     summary: Get details of a specific report assigned to the agency
 *     tags: [Agency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Report ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report fetched successfully
 *       404:
 *         description: Report not found
 */
router.get("/:id", getAgencyReportById);

/**
 * @swagger
 * /agency/{reportId}/messages:
 *   post:
 *     summary: Add a message or update to a report assigned to the agency
 *     tags: [Agency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         description: The ID of the report
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Field inspection completed, awaiting further action.
 *     responses:
 *       200:
 *         description: Message added successfully
 *       404:
 *         description: Report not found
 */
router.post("/:reportId/messages", addAgencyMessage);

/**
 * @swagger
 * /agency/{reportId}/status:     
 *  patch: 
 *    summary: Update the status of a report assigned to the agency
 *   tags: [Agency]
 *   security:
 *    - bearerAuth: []
 *   parameters:
 *    - in: path
 *     name: reportId
 *    required: true
 *    description: The ID of the report
 *   schema:
 *    type: string
 *  requestBody:
 *   required: true
 *  content:
 *   application/json:
 *    schema:
 *    type: object
 *    properties:
 *    status:
 *    type: string
 *   example: resolved
 *  responses:
 *  200:
 *   description: Report status updated successfully
 *  404:
 *  description: Report not found
 *  403:
 *  description: Unauthorized to update this report
 * ///  /agency/{reportId}/status
 */
router.patch("/:reportId/status", updateAgencyReportStatus);

export default router;

// GET /api/agency/reports?status=pending&page=1&keyword=road
