const express = require("express");
const cors = require("cors");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const path = require("path");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const requestRoutes = require("./routes/requests");

// Import middleware
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// Initialize database (creates tables and seeds data)
require("./config/database");

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:4000",
      "https://2025tm93177-rashi.github.io",
      "https://2025tm93177-rashi.github.io/SchoolEquipmentLandingPortal",
      process.env.CORS_ORIGIN || "*",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "School Equipment Lending Portal API",
    version: "1.0.0",
    documentation:
      "https://2025tm93177-rashi.github.io/SchoolEquipmentLandingPortal/",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ===== SWAGGER SETUP =====
const swaggerFilePath = path.join(__dirname, "docs", "swagger.yaml");
// OR if at root: path.join(__dirname, 'swagger.yaml')

const swaggerDocument = YAML.parse(fs.readFileSync(swaggerFilePath, "utf8"));

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "list",
      filter: true,
      showRequestHeaders: true,
    },
    customCss: ".topbar { display: none }", // Optional
    customSiteTitle: "Equipment Portal API Docs",
  }),
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/requests", requestRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log("=================================================");
  console.log(` Server is running on http://localhost:${PORT}`);
});

module.exports = app;
