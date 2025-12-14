import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./utils/db.js";

import projectRouter from "./routes/projectRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import authRouter from "./routes/authRoutes.js";
import studentRouter from "./routes/studentRoutes.js";
import facultyRouter from "./routes/facultyRoutes.js";
import correlationId from "./middlewares/correlationId.js";
import requestLogger from "./middlewares/requestLogger.js";
import logger from "./utils/logger.js";

import otpRouter from "./routes/otpRoutes.js";
import helmet from "helmet";

dotenv.config();
connectDB();

const app = express();

// Helmet for common security
if (process.env.NODE_ENV !== "production") {
  app.use(helmet({ strictTransportSecurity: false }));
} else {
  app.use(
    helmet.strictTransportSecurity({
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    }),
  );
}

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
// app.use(cookieParser()); // good to have for future

// correlation id (requestId) must be set before request logging
app.use(correlationId);
// request logger - logs incoming requests and timings
app.use(requestLogger);

const PORT = process.env.PORT || 5000;

// Mount API routes
app.use("/api/auth", authRouter); // POST /api/auth/login
app.use("/api/project", projectRouter); // project routes
app.use("/api/admin", adminRouter); // GET /api/admin/allFaculty etc.
app.use("/api/student", studentRouter);
app.use("/api/faculty", facultyRouter); // GET /api/faculty/getFacultyDetails/:id
app.use("/api/otp", otpRouter);

app.listen(PORT, () => {
  logger.info("server_start", {
    message: `Server running at http://localhost:${PORT}`,
  });
});
