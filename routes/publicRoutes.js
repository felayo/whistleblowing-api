import express from "express";
import { getPublicScorecard } from "../controllers/reporterController.js";

const router = express.Router();

router.get("/", getPublicScorecard);

export default router;