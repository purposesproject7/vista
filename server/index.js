import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import connectDB from "./utils/db.js";
import { logger } from "./utils/logger.js";

import correlationId from "./middlewares/correlationId.js";
import requestLogger from "./middlewares/requestLogger.js";
import sanitizeInput from "./middlewares/sanitizeInput.js";
import { broadcastBlockMiddleware } from "./middlewares/broadcastBlock.js";
import errorHandler from "./middlewares/errorHandler.js";
import rateLimiter from "./middlewares/rateLimiter.js";

import authRouter from "./routes/authRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import projectCoordinatorRouter from "./routes/projectCoordinatorRoutes.js";
import facultyRouter from "./routes/facultyRoutes.js";
import studentRouter from "./routes/studentRoutes.js";
import projectRouter from "./routes/projectRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Security - Helmet
if (process.env.NODE_ENV === "production") {
  app.use(
    helmet({
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
} else {
  app.use(
    helmet({
      strictTransportSecurity: false,
      contentSecurityPolicy: false,
    }),
  );
}

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes("*")
      ) {
        callback(null, true);
      } else {
        logger.warn("cors_blocked", { origin, allowedOrigins });
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
  }),
);

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser());

// Request tracking and logging
app.use(correlationId);
app.use(requestLogger);
app.use(sanitizeInput);

// Rate limiting (production only)
if (process.env.NODE_ENV === "production") {
  app.use(rateLimiter);
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VIT Project Management System API",
    version: "2.0.0",
    documentation: "/api/docs",
    health: "/health",
  });
});

// API Routes
app.use("/api/auth", authRouter); 
app.use("/api/admin", adminRouter);
app.use("/api/coordinator", projectCoordinatorRouter);
app.use("/api/faculty", facultyRouter);
app.use("/api/student", studentRouter);
app.use("/api/project", projectRouter);

// 404 Handler
app.use((req, res, next) => {
  logger.warn("route_not_found", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info("shutdown_initiated", {
    signal,
    message: `Received ${signal}. Closing server gracefully...`,
  });

  server.close(async () => {
    logger.info("server_closed", { message: "HTTP server closed" });

    try {
      await mongoose.connection.close();
      logger.info("database_closed", { message: "MongoDB connection closed" });
      process.exit(0);
    } catch (error) {
      logger.error("shutdown_error", {
        message: "Error during shutdown",
        error: error.message,
      });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("shutdown_forced", {
      message: "Forcing shutdown after timeout",
    });
    process.exit(1);
  }, 10000);
};

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  logger.info("server_start", {
    message: `Server running at http://${HOST}:${PORT}`,
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    pid: process.pid,
  });

  logger.info("server_config", {
    allowedOrigins,
    mongoUri: process.env.MONGO_URI ? "***configured***" : "missing",
    jwtSecret: process.env.JWT_SECRET ? "***configured***" : "missing",
  });
});

// Process error handlers
process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandled_rejection", {
    message: "Unhandled Promise Rejection",
    reason: reason?.message || reason,
    stack: reason?.stack,
  });

  if (process.env.NODE_ENV === "production") {
    gracefulShutdown("UNHANDLED_REJECTION");
  }
});

process.on("uncaughtException", (error) => {
  logger.error("uncaught_exception", {
    message: "Uncaught Exception",
    error: error.message,
    stack: error.stack,
  });

  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
