/**
 * Route extraction utilities
 */

/**
 * Extract all routes from Express app
 * @param {Object} app - Express application instance
 * @returns {Array} Array of route objects with method and path
 */
export function getAllRoutes(stack, basePath = "") {
  const routes = [];

  stack.forEach((layer) => {
    if (layer.route) {
      // Direct route (e.g., app.get('/health', ...))
      const methods = Object.keys(layer.route.methods)
        .map((m) => m.toUpperCase())
        .join(", ");

      const path = basePath + layer.route.path;
      routes.push({ methods, path });
    } else if (layer.name === "router" && layer.handle.stack) {
      // Mounted sub-router (e.g., app.use('/api', routes))
      const mountPath = layer.path || ""; // Express 5 provides .path directly
      routes.push(...getAllRoutes(layer.handle.stack, basePath + mountPath));
    }
  });

  // Sort for consistent output
  return routes.sort((a, b) => a.path.localeCompare(b.path));
}
