import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getUnassignedReports,
  getAllReports,
  getReportById,
  updateReportCategory,
  assignReportToAgency,
  updateReportStatus,
  createCategory,
  createAgency,
  getAllCategories,
  getAllAgencies,
  deleteCategory,
  deleteAgency,
  addAdminMessage,
} from "../controllers/adminController.js";
import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management and report handling
 */

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: Get all reports (with pagination, search, and filter options)
 *     description: Retrieve all reports. Supports filtering by status, keyword search, and pagination.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search reports by caseID, title, or description (e.g. ?keyword=traffic)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved, closed]
 *         description: Filter reports by status (e.g. ?status=pending)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (e.g. ?page=2)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page (e.g. ?limit=5)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: createdAt
 *         description: Sort reports by field (e.g. ?sort=createdAt)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: desc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Successfully retrieved list of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalReports:
 *                   type: integer
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       caseID:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, in_progress, resolved, closed]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       agencyAssigned:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.route("/reports").get(protect, authorize("admin"), getAllReports);

/**
 * @swagger
 * /admin/reports/unassigned:
 *   get:
 *     summary: Get all unassigned reports
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched unassigned reports
 */
router
  .route("/reports/unassigned")
  .get(protect, authorize("admin"), getUnassignedReports);

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched all categories
 *   post:
 *     summary: Create a new category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router
  .route("/categories")
  .post(protect, authorize("admin"), createCategory)
  .get(protect, authorize("admin"), getAllCategories);

/**
 * @swagger
 * /admin/agencies:
 *   get:
 *     summary: Get all agencies
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched all agencies
 *   post:
 *     summary: Create a new agency
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Agency created successfully
 */
router
  .route("/agencies")
  .post(protect, authorize("admin"), createAgency)
  .get(protect, authorize("admin"), getAllAgencies);

/**
 * @swagger
 * /admin/reports/{id}:
 *   get:
 *     summary: Get report by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report fetched successfully
 */
router.route("/reports/:id").get(protect, authorize("admin"), getReportById);

/**
 * @swagger
 * /admin/reports/{id}/category:
 *   patch:
 *     summary: Update report category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report category updated successfully
 */
router
  .route("/reports/:id/category")
  .patch(protect, authorize("admin"), updateReportCategory);

/**
 * @swagger
 * /admin/reports/{id}/assign:
 *   patch:
 *     summary: Assign report to agency
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report assigned successfully
 */
router
  .route("/reports/:id/assign")
  .patch(protect, authorize("admin"), assignReportToAgency);

/**
 * @swagger
 * /admin/reports/{id}/status:
 *   patch:
 *     summary: Update report status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report status updated successfully
 */
router
  .route("/reports/:id/status")
  .patch(protect, authorize("admin"), updateReportStatus);

/**
 * @swagger
 * /admin/reports/{id}/messages:
 *   post:
 *     summary: Add admin message to a report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Message added successfully
 */
router
  .route("/reports/:reportId/messages")
  .post(protect, authorize("admin"), addAdminMessage);

/**
 * @swagger
 * /admin/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
router
  .route("/categories/:id")
  .delete(protect, authorize("admin"), deleteCategory);

/**
 * @swagger
 * /admin/agencies/{id}:
 *   delete:
 *     summary: Delete an agency
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Agency ID
 *     responses:
 *       200:
 *         description: Agency deleted successfully
 */

router.route("/agencies/:id").delete(protect, authorize("admin"), deleteAgency);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users in the system. Accessible only to Super Admins.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 670f47d2a3b92f001fc91c9b
 *                       username:
 *                         type: string
 *                         example: johndoe
 *                       email:
 *                         type: string
 *                         example: johndoe@example.com
 *                       role:
 *                         type: string
 *                         example: agency
 *                       agencyAssigned:
 *                         type: string
 *                         nullable: true
 *                         example: 6710e9ab8f93a4f3e2e3b4f5
 *                       active:
 *                         type: boolean
 *                         example: true
 *
 *   post:
 *     summary: Create a new user (Super Admin only)
 *     description: Allows the Super Admin to create a new user and optionally assign them to an existing agency.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: P@ssword123
 *               role:
 *                 type: string
 *                 enum: [admin, agency]
 *                 example: agency
 *               agencyId:
 *                 type: string
 *                 description: Optional. The ID of the agency to assign the user to.
 *                 example: 670f47d2a3b92f001fc91c9b
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: User created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 670f47d2a3b92f001fc91c9b
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     role:
 *                       type: string
 *                       example: agency
 *                     agencyAssigned:
 *                       type: string
 *                       nullable: true
 *                       example: 6710e9ab8f93a4f3e2e3b4f5
 *                     active:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Missing fields or invalid data
 *       403:
 *         description: Only Super Admins can create users
 *       404:
 *         description: Agency not found
 */
router
  .route("/users")
  .post(protect, authorize("admin"), createUser)
  .get(protect, authorize("admin"), getUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User fetched successfully
 *   put:
 *     summary: Update a user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User updated successfully
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router
  .route("/users/:id")
  .get(protect, authorize("admin"), getUser)
  .put(protect, authorize("admin"), updateUser)
  .delete(protect, authorize("admin"), deleteUser);

export default router;
