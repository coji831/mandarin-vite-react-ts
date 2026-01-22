/**
 * @file apps/backend/src/api/docs/openapi.js
 * @description OpenAPI 3.1 specification configuration for API documentation
 */

import swaggerJsdoc from "swagger-jsdoc";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Mandarin Learning Platform API",
      version: "1.0.0",
      description: "Backend API for Mandarin vocabulary learning and conversation generation",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
      {
        url: "https://mandarin-backend.railway.app",
        description: "Production server (Railway)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token for authenticated requests",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
          description: "HTTP-only refresh token cookie",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
            details: {
              type: "object",
              description: "Additional error details",
            },
          },
          required: ["error"],
        },
        VocabularyList: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique list identifier",
            },
            name: {
              type: "string",
              description: "List display name",
            },
            description: {
              type: "string",
              description: "List description",
            },
            difficulty: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
              description: "Difficulty level",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Category tags",
            },
            csvFile: {
              type: "string",
              description: "CSV filename in GCS bucket",
            },
          },
          required: ["id", "name"],
        },
        VocabularyWord: {
          type: "object",
          properties: {
            wordId: {
              type: "string",
              description: "Unique word identifier",
            },
            simplified: {
              type: "string",
              description: "Simplified Chinese characters",
            },
            traditional: {
              type: "string",
              description: "Traditional Chinese characters",
            },
            pinyin: {
              type: "string",
              description: "Pinyin pronunciation",
            },
            english: {
              type: "string",
              description: "English translation",
            },
          },
          required: ["wordId", "simplified", "pinyin", "english"],
        },
        Progress: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Progress record ID",
            },
            userId: {
              type: "string",
              description: "User ID",
            },
            wordId: {
              type: "string",
              description: "Word ID",
            },
            confidenceLevel: {
              type: "integer",
              minimum: 0,
              maximum: 4,
              description: "0=New, 1=Learning, 2=Familiar, 3=Confident, 4=Mastered",
            },
            reviewCount: {
              type: "integer",
              description: "Number of times reviewed",
            },
            lastReviewedAt: {
              type: "string",
              format: "date-time",
              description: "Last review timestamp",
            },
            nextReviewAt: {
              type: "string",
              format: "date-time",
              description: "Next scheduled review",
            },
          },
          required: ["userId", "wordId", "confidenceLevel"],
        },
      },
    },
  },
  apis: [path.join(__dirname, "../routes/*.js"), path.join(__dirname, "../controllers/*.js")],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
