/**
 * @file apps/backend/src/api/docs/openapi.js
 * @description OpenAPI 3.1 specification loader - reads from YAML file instead of JSDoc annotations
 * @architecture Clean separation: API specs in YAML, route logic in JS files
 */

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Loads OpenAPI specification from YAML file
 * @returns {object} OpenAPI 3.1.0 specification object
 */
function loadOpenAPISpec() {
  const yamlPath = path.join(__dirname, "openapi.yaml");

  try {
    const fileContents = fs.readFileSync(yamlPath, "utf8");
    const spec = yaml.load(fileContents);
    return spec;
  } catch (error) {
    console.error("Failed to load OpenAPI YAML:", error);
    throw new Error(`OpenAPI specification loading failed: ${error.message}`);
  }
}

export const swaggerSpec = loadOpenAPISpec();
export default swaggerSpec;
