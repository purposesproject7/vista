// src/services/websocketService.js
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import Faculty from "../models/facultySchema.js";
import { logger } from "../utils/logger.js";
import compression from "compression";

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.facultyRooms = new Map();
    this.updateQueues = new Map();
    this.rateLimits = new Map();

    // Configuration for potato optimization
    this.config = {
      maxUpdatesPerSecond: 2,
      compressionThreshold: 1024,
      maxQueueSize: 100,
      heartbeatInterval: 30000,
      reconnectAttempts: 5,
      updateBatchSize: 10,
      memoryCleanupInterval: 300000, // 5 minutes
    };
  }

  initialize(server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(",") || [
          "http://localhost:3000",
          "http://localhost:5173",
        ],
        credentials: true,
      },
      compression: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB max
      transports: ["websocket", "polling"],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startCleanupTimer();

    logger.info("websocket_service_initialized", {
      message: "WebSocket service initialized successfully",
    });
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const faculty = await Faculty.findById(decoded._id).select(
          "name employeeId school department role",
        );

        if (!faculty) {
          return next(new Error("Faculty not found"));
        }

        socket.facultyId = faculty._id.toString();
        socket.facultyData = faculty;
        next();
      } catch (error) {
        logger.warn("websocket_auth_failed", {
          error: error.message,
          socketId: socket.id,
        });
        next(new Error("Authentication failed"));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      this.handleConnection(socket);

      socket.on("join_faculty_room", (data) =>
        this.handleJoinFacultyRoom(socket, data),
      );
      socket.on("leave_faculty_room", (data) =>
        this.handleLeaveFacultyRoom(socket, data),
      );
      socket.on("request_faculty_data", (data) =>
        this.handleDataRequest(socket, data),
      );
      socket.on("mark_submission", (data) =>
        this.handleMarkSubmission(socket, data),
      );
      socket.on("ping", () => this.handlePing(socket));
      socket.on("disconnect", () => this.handleDisconnection(socket));
    });
  }

  handleConnection(socket) {
    const facultyId = socket.facultyId;

    this.connectedUsers.set(socket.id, {
      facultyId,
      socket,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      rooms: new Set(),
    });

    // Initialize rate limiting
    this.rateLimits.set(socket.id, {
      lastUpdate: 0,
      updateCount: 0,
      windowStart: Date.now(),
    });

    logger.info("faculty_connected", {
      facultyId,
      socketId: socket.id,
      totalConnections: this.connectedUsers.size,
    });

    socket.emit("connection_established", {
      success: true,
      facultyId,
      serverTime: Date.now(),
      config: {
        maxUpdatesPerSecond: this.config.maxUpdatesPerSecond,
        heartbeatInterval: this.config.heartbeatInterval,
      },
    });
  }

  handleJoinFacultyRoom(socket, data) {
    try {
      const { filters } = data;
      const roomKey = this.generateRoomKey(socket.facultyId, filters);

      socket.join(roomKey);

      const userInfo = this.connectedUsers.get(socket.id);
      if (userInfo) {
        userInfo.rooms.add(roomKey);
        userInfo.lastActivity = Date.now();
      }

      // Add to faculty rooms tracking
      if (!this.facultyRooms.has(roomKey)) {
        this.facultyRooms.set(roomKey, {
          filters,
          facultyId: socket.facultyId,
          members: new Set(),
          lastDataFetch: 0,
          cachedData: null,
        });
      }
      this.facultyRooms.get(roomKey).members.add(socket.id);

      logger.info("faculty_joined_room", {
        facultyId: socket.facultyId,
        socketId: socket.id,
        roomKey,
      });

      socket.emit("room_joined", { success: true, roomKey });
    } catch (error) {
      logger.error("join_room_error", {
        error: error.message,
        socketId: socket.id,
      });
      socket.emit("room_join_error", { message: error.message });
    }
  }

  handleLeaveFacultyRoom(socket, data) {
    try {
      const { roomKey } = data;

      socket.leave(roomKey);

      const userInfo = this.connectedUsers.get(socket.id);
      if (userInfo) {
        userInfo.rooms.delete(roomKey);
      }

      const room = this.facultyRooms.get(roomKey);
      if (room) {
        room.members.delete(socket.id);
        if (room.members.size === 0) {
          this.facultyRooms.delete(roomKey);
        }
      }

      socket.emit("room_left", { success: true, roomKey });
    } catch (error) {
      logger.error("leave_room_error", {
        error: error.message,
        socketId: socket.id,
      });
    }
  }

  async handleDataRequest(socket, data) {
    try {
      const { roomKey, requestId } = data;

      if (!this.checkRateLimit(socket.id)) {
        socket.emit("data_response", {
          requestId,
          success: false,
          error: "Rate limit exceeded",
        });
        return;
      }

      const room = this.facultyRooms.get(roomKey);
      if (!room) {
        socket.emit("data_response", {
          requestId,
          success: false,
          error: "Room not found",
        });
        return;
      }

      // Check if we have fresh cached data (within last 5 seconds)
      const now = Date.now();
      if (room.cachedData && now - room.lastDataFetch < 5000) {
        socket.emit("data_response", {
          requestId,
          success: true,
          data: room.cachedData,
          cached: true,
          timestamp: room.lastDataFetch,
        });
        return;
      }

      // Fetch fresh data (this would integrate with your existing faculty service)
      const freshData = await this.fetchFacultyData(
        socket.facultyId,
        room.filters,
      );

      room.cachedData = this.compressDataForPotato(freshData);
      room.lastDataFetch = now;

      socket.emit("data_response", {
        requestId,
        success: true,
        data: room.cachedData,
        cached: false,
        timestamp: now,
      });
    } catch (error) {
      logger.error("data_request_error", {
        error: error.message,
        socketId: socket.id,
      });
      socket.emit("data_response", {
        requestId: data.requestId,
        success: false,
        error: error.message,
      });
    }
  }

  handleMarkSubmission(socket, data) {
    try {
      const { projectId, studentId, marks, reviewType } = data;

      // Broadcast to relevant rooms
      const relevantRooms = this.findRelevantRooms(socket.facultyId, projectId);

      const updateData = this.compressDataForPotato({
        type: "mark_updated",
        projectId,
        studentId,
        marks,
        reviewType,
        facultyId: socket.facultyId,
        timestamp: Date.now(),
      });

      relevantRooms.forEach((roomKey) => {
        socket.to(roomKey).emit("real_time_update", updateData);
      });

      logger.info("mark_submission_broadcasted", {
        facultyId: socket.facultyId,
        projectId,
        studentId,
        roomsNotified: relevantRooms.length,
      });
    } catch (error) {
      logger.error("mark_submission_error", {
        error: error.message,
        socketId: socket.id,
      });
    }
  }

  handlePing(socket) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (userInfo) {
      userInfo.lastActivity = Date.now();
    }
    socket.emit("pong", { timestamp: Date.now() });
  }

  handleDisconnection(socket) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (userInfo) {
      // Clean up room memberships
      userInfo.rooms.forEach((roomKey) => {
        const room = this.facultyRooms.get(roomKey);
        if (room) {
          room.members.delete(socket.id);
          if (room.members.size === 0) {
            this.facultyRooms.delete(roomKey);
          }
        }
      });

      logger.info("faculty_disconnected", {
        facultyId: userInfo.facultyId,
        socketId: socket.id,
        connectionDuration: Date.now() - userInfo.connectedAt,
      });
    }

    this.connectedUsers.delete(socket.id);
    this.rateLimits.delete(socket.id);
  }

  // Utility methods for optimization
  generateRoomKey(facultyId, filters) {
    const filterString = JSON.stringify(filters);
    return `faculty_${facultyId}_${Buffer.from(filterString).toString("base64").slice(0, 10)}`;
  }

  checkRateLimit(socketId) {
    const limit = this.rateLimits.get(socketId);
    if (!limit) return false;

    const now = Date.now();
    const windowDuration = 1000; // 1 second

    if (now - limit.windowStart > windowDuration) {
      limit.windowStart = now;
      limit.updateCount = 0;
    }

    if (limit.updateCount >= this.config.maxUpdatesPerSecond) {
      return false;
    }

    limit.updateCount++;
    limit.lastUpdate = now;
    return true;
  }

  compressDataForPotato(data) {
    // Remove unnecessary fields and compress data structure
    if (Array.isArray(data)) {
      return data.map((item) => this.compressItem(item));
    }
    return this.compressItem(data);
  }

  compressItem(item) {
    if (!item || typeof item !== "object") return item;

    // Remove large, unnecessary fields for real-time updates
    const compressed = { ...item };

    // Remove verbose fields that aren't needed for UI updates
    delete compressed.__v;
    delete compressed.createdAt;
    delete compressed.updatedAt;

    // Compress nested objects
    if (compressed.teams) {
      compressed.teams = compressed.teams.map((team) => ({
        id: team.id,
        name: team.name,
        isMarked: team.isMarked,
        status: team.status,
      }));
    }

    return compressed;
  }

  async fetchFacultyData(facultyId, filters) {
    try {
      // Import faculty controller functions for data fetching
      const Faculty = await import("../models/facultySchema.js");
      const Project = await import("../models/projectSchema.js");
      const Panel = await import("../models/panelSchema.js");

      const { year, school, programme, type } = filters;

      let reviews = [];

      if (type === "guide") {
        // Get projects where faculty is the guide
        const projects = await Project.default
          .find({
            guideFaculty: facultyId,
            academicYear: year,
            school: school,
            program: programme,
          })
          .populate("students", "name regNo emailId guideMarks")
          .populate("guideFaculty", "name employeeId")
          .lean();

        reviews = projects.map((project) => ({
          id: project._id,
          title: project.title,
          type: "guide",
          startDate: project.reviewDates?.guide?.startDate || new Date(),
          endDate:
            project.reviewDates?.guide?.endDate ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          teams: [
            {
              id: project._id,
              name: project.title,
              students: project.students,
              isMarked:
                project.students?.some((s) => s.guideMarks?.length > 0) ||
                false,
            },
          ],
        }));
      } else if (type === "panel") {
        // Get projects where faculty is in the panel
        const panels = await Panel.default
          .find({
            "members.faculty": facultyId,
            academicYear: year,
            school: school,
            program: programme,
          })
          .populate({
            path: "projects",
            populate: {
              path: "students",
              select: "name regNo emailId panelMarks",
            },
          })
          .lean();

        reviews = panels.flatMap(
          (panel) =>
            panel.projects?.map((project) => ({
              id: project._id,
              title: project.title,
              type: "panel",
              startDate: project.reviewDates?.panel?.startDate || new Date(),
              endDate:
                project.reviewDates?.panel?.endDate ||
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              teams: [
                {
                  id: project._id,
                  name: project.title,
                  students: project.students,
                  isMarked:
                    project.students?.some((s) => s.panelMarks?.length > 0) ||
                    false,
                },
              ],
            })) || [],
        );
      }

      // Categorize reviews
      const now = new Date();
      const active = reviews.filter(
        (r) =>
          new Date(r.startDate) <= now &&
          new Date(r.endDate) >= now &&
          !r.teams.every((t) => t.isMarked),
      );

      const deadlinePassed = reviews.filter(
        (r) => new Date(r.endDate) < now && !r.teams.every((t) => t.isMarked),
      );

      const past = reviews.filter((r) => r.teams.every((t) => t.isMarked));

      return {
        active,
        deadlinePassed,
        past,
        statistics: {
          total: reviews.length,
          active: active.length,
          completed: past.length,
          pending: active.length + deadlinePassed.length,
        },
      };
    } catch (error) {
      console.error("[WebSocket] Faculty data fetch error:", error);
      // Return empty structure on error
      return {
        active: [],
        deadlinePassed: [],
        past: [],
        statistics: {
          total: 0,
          completed: 0,
          pending: 0,
        },
      };
    }
  }

  findRelevantRooms(facultyId, projectId) {
    const relevantRooms = [];

    this.facultyRooms.forEach((room, roomKey) => {
      // Include rooms for the faculty who submitted marks
      if (room.facultyId === facultyId) {
        relevantRooms.push(roomKey);
      }

      // Also include rooms for other faculty who might be involved in the same project
      // (e.g., panel members for a guide's project or vice versa)
      if (projectId && room.filters) {
        // This could be enhanced to check if the project affects this room's data
        relevantRooms.push(roomKey);
      }
    });

    return [...new Set(relevantRooms)]; // Remove duplicates
  }

  // Broadcast updates to specific faculty
  broadcastToFaculty(facultyId, eventName, data) {
    this.connectedUsers.forEach((userInfo, socketId) => {
      if (userInfo.facultyId === facultyId) {
        const compressedData = this.compressDataForPotato(data);
        userInfo.socket.emit(eventName, compressedData);
      }
    });
  }

  // Broadcast to all connected faculty
  broadcastToAll(eventName, data) {
    const compressedData = this.compressDataForPotato(data);
    this.io.emit(eventName, compressedData);
  }

  // Memory cleanup
  startCleanupTimer() {
    setInterval(() => {
      this.performMemoryCleanup();
    }, this.config.memoryCleanupInterval);
  }

  performMemoryCleanup() {
    const now = Date.now();
    const inactiveThreshold = 600000; // 10 minutes

    // Clean up inactive rooms
    this.facultyRooms.forEach((room, roomKey) => {
      if (room.members.size === 0) {
        this.facultyRooms.delete(roomKey);
      } else if (
        room.lastDataFetch &&
        now - room.lastDataFetch > inactiveThreshold
      ) {
        room.cachedData = null; // Clear old cached data
      }
    });

    // Clean up inactive connections
    this.connectedUsers.forEach((userInfo, socketId) => {
      if (now - userInfo.lastActivity > inactiveThreshold) {
        // Mark for cleanup but don't remove immediately as socket might still be connected
        userInfo.inactive = true;
      }
    });

    // Clean up rate limits for disconnected users
    this.rateLimits.forEach((limit, socketId) => {
      if (!this.connectedUsers.has(socketId)) {
        this.rateLimits.delete(socketId);
      }
    });

    logger.info("memory_cleanup_completed", {
      activeRooms: this.facultyRooms.size,
      activeConnections: this.connectedUsers.size,
      rateLimitEntries: this.rateLimits.size,
    });
  }

  // Get service statistics
  getStats() {
    const roomDetails = [];
    this.facultyRooms.forEach((room, roomKey) => {
      roomDetails.push({
        key: roomKey,
        members: room.members.size,
        lastFetch: room.lastDataFetch
          ? new Date(room.lastDataFetch).toISOString()
          : null,
        hasCachedData: !!room.cachedData,
      });
    });

    const connectionDetails = Array.from(this.connectedUsers.values()).map(
      (user) => ({
        facultyId: user.facultyId,
        connectedAt: new Date(user.connectedAt).toISOString(),
        lastActivity: new Date(user.lastActivity).toISOString(),
        roomCount: user.rooms.size,
        inactive: user.inactive || false,
      }),
    );

    return {
      totalConnections: this.connectedUsers.size,
      activeRooms: this.facultyRooms.size,
      rateLimitEntries: this.rateLimits.size,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      rooms: roomDetails,
      connections: connectionDetails,
    };
  }
}

export default new WebSocketService();
