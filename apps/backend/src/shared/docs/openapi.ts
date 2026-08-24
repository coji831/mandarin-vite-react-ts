/**
 * @file apps/backend/src/shared/docs/openapi.ts
 * @description OpenAPI 3.1 specification loader — reads the spec from the
 * YAML file instead of JSDoc annotations (specs in YAML, route logic in TS).
 */

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Loads OpenAPI specification from YAML file
 * @returns OpenAPI 3.1.0 specification object
 */
function loadOpenAPISpec(): Record<string, unknown> {
  const yamlPath = path.join(__dirname, "openapi.yaml");

  try {
    const fileContents = fs.readFileSync(yamlPath, "utf8");
    const spec = yaml.load(fileContents) as Record<string, unknown>;
    return spec;
  } catch (error) {
    throw new Error(
      `OpenAPI specification loading failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const swaggerSpec = loadOpenAPISpec();
export default swaggerSpec;
