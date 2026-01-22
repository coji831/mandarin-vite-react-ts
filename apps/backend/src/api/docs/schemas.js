/**
 * @file apps/backend/src/api/docs/schemas.js
 * @description Reusable OpenAPI schema components
 *
 * This file provides centralized schema definitions that can be referenced
 * in route JSDoc comments using $ref: '#/components/schemas/SchemaName'
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ListProgress:
 *       type: object
 *       properties:
 *         listId:
 *           type: string
 *           description: Vocabulary list ID
 *         listName:
 *           type: string
 *           description: List display name
 *         totalWords:
 *           type: integer
 *           description: Total words in list
 *         masteredCount:
 *           type: integer
 *           description: Words at confidence level 4
 *         confidenceDistribution:
 *           type: object
 *           properties:
 *             0:
 *               type: integer
 *             1:
 *               type: integer
 *             2:
 *               type: integer
 *             3:
 *               type: integer
 *             4:
 *               type: integer
 *           description: Count of words at each confidence level
 *
 *     ProgressStats:
 *       type: object
 *       properties:
 *         totalWords:
 *           type: integer
 *           description: Total words tracked
 *         masteredWords:
 *           type: integer
 *           description: Words at confidence level 4
 *         learningWords:
 *           type: integer
 *           description: Words at confidence levels 1-3
 *         newWords:
 *           type: integer
 *           description: Words at confidence level 0
 *         reviewsDue:
 *           type: integer
 *           description: Words due for review today
 */

export default {};
