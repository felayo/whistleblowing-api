import express from "express";
import {
  login,
  refresh,
  updatePassword,
  logout,
} from "../controllers/authController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and session management
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user (admin or agency)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/refresh:
 *   get:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.get("/refresh", refresh);

/**
 * @swagger
 * /auth/update-password:
 *   post:
 *     summary: Update password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.post("/update-password", updatePassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", logout);

export default router;
