import cors from "cors";
import dotenv from "dotenv";

import express from "express";
import config from "./config/index.js";
import routes from "./routes/index.js";
import { getAllRoutes } from "./utils/routeUtils.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for development
app.use(
  cors({
    //origin: config.frontendUrl,
    origin: true, // reflect request Origin (allows any origin)
    credentials: true, // allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // add any other headers you use
  })
);

// Mount routes
app.use("/api", routes);

// Health check endpoint (move BEFORE error handler)
app.get("/routes", (req, res) => {
  if (app.router && app.router.stack) {
    const allRoutes = getAllRoutes(app.router.stack, "/api");

    // You can choose JSON or pretty HTML/table
    if (req.query.format === "json") {
      res.json({ routes: allRoutes });
    } else {
      // Simple HTML table for easy viewing in browser
      const html = `
          <h1>Available API Routes (${allRoutes.length})</h1>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th align="left">Methods</th>
                <th align="left">Path</th>
              </tr>
            </thead>
            <tbody>
              ${allRoutes
                .map(
                  (r) =>
                    `<tr><td><code>${r.methods}</code></td><td><code>${r.path}</code></td></tr>`
                )
                .join("")}
            </tbody>
          </table>
          <p><small>Tip: Add <code>?format=json</code> for JSON output.</small></p>
        `;
      res.send(html);
    }
  } else {
    res.status(500).send("Router stack not available");
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: config.nodeEnvironment === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`Backend server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnvironment}`);
});

export default app;
