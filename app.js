import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { swaggerDocs } from "./swagger.js";

import reportRoutes from "./routes/reporterRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import agencyRoutes from "./routes/agencyRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

import ErrorHandler from "./middleware/error.js";
import { logger } from "./middleware/logger.js";
import corsOptions from "./config/corsOptions.js";

const app = express();

// middleware
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(cookieParser());

// test route
app.get("/", (req, res) => {
  res.send("Welcome to Whistleblowing API 🚨");
});

// API routes
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/agency", agencyRoutes);
app.use("/api/scorecard", publicRoutes);

// error handler
app.use(ErrorHandler);

// 📘 Swagger Documentation
swaggerDocs(app);

export default app;


