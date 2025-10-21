// routes/reportRoutes.js
import express from "express";
import {
  createReport,
  getReportByPassword,
  addWhistleblowerMessage,
} from "../controllers/reporterController.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Whistleblower Reports
 *     description: Endpoints for anonymous/confidential whistle-blowers to create and follow up on reports
 */

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Create a new whistleblower report
 *     description: Submit a new report with optional evidence files (images, videos, or documents).
 *     tags: [Whistleblower Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Broken streetlight at main junction
 *               description:
 *                 type: string
 *                 example: The streetlight at the main junction has been vandalized and needs repair.
 *               location:
 *                 type: string
 *                 example: Ikeja, Lagos
 *               reporterType:
 *                 type: string
 *                 enum: [anonymous, confidential]
 *                 example: confidential
 *               reporterName:
 *                 type: string
 *                 example: John Doe
 *               reporterEmail:
 *                 type: string
 *                 example: johndoe@example.com
 *               reporterPhone:
 *                 type: string
 *                 example: +2348012345678
 *               evidenceFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload up to 5 evidence files (images, videos, or documents)
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Report submitted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     caseID:
 *                       type: string
 *                       example: CASE-00123
 *                     status:
 *                       type: string
 *                       example: pending
 *                     reporterType:
 *                       type: string
 *                       example: confidential
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input or missing required fields
 *       500:
 *         description: Internal server error
 */
router.route("/").post(upload.array("evidenceFiles", 5), createReport);

/**
 * @swagger
 * /reports/follow-up:
 *   get:
 *     summary: Retrieve a report using password
 *     tags: [Whistleblower Reports]
 *     description: Allows a whistle-blower to view the current status of their report using their unique password.
 *     parameters:
 *       - in: query
 *         name: password
 *         required: true
 *         schema:
 *           type: string
 *           example: Wh1stle@123
 *         description: The unique password provided when the report was submitted.
 *     responses:
 *       200:
 *         description: Report details fetched successfully
 *       401:
 *         description: Invalid password or report not found
 */
router.route("/follow-up").post(getReportByPassword);

/**
 * @swagger
 * /reports/message:
 *   post:
 *     summary: Add follow-up message or evidence to a report (Whistle-blower)
 *     tags: [Whistleblower Reports]
 *     description: |
 *       Allows the whistle-blower to add a follow-up message or upload additional evidence 
 *       to an existing report using their unique case password.  
 *       Supports text updates and optional file uploads (e.g., images, videos, or documents).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - message
 *             properties:
 *               password:
 *                 type: string
 *                 description: Unique case password generated when report was created
 *                 example: A9F4C2
 *               message:
 *                 type: string
 *                 description: Follow-up message or additional details
 *                 example: I have new evidence showing the suspect’s face.
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional evidence files (images, videos, documents, etc.)
 *     responses:
 *       201:
 *         description: Message added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Message added successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             example: reporter
 *                           message:
 *                             type: string
 *                             example: I have new evidence showing the suspect’s face.
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-10-20T14:22:00.000Z
 *                     evidenceFiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filePath:
 *                             type: string
 *                             example: https://s3.amazonaws.com/bucket/evidence123.jpg
 *                           fileType:
 *                             type: string
 *                             example: image
 *                           fileName:
 *                             type: string
 *                             example: suspect_photo.jpg
 *                           uploadedAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-10-20T14:25:00.000Z
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Password and message are required.
 *       401:
 *         description: Invalid password or report not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid password. Report not found.
 */
router.post("/message", upload.array("evidenceFiles", 5), addWhistleblowerMessage);

export default router;
