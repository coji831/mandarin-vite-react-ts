import { createLogger, transports, format } from "winston";

export const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: "logs/conversation-service.log",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Cost tracking middleware
export function trackTTSUsage(conversationId: string, durationSeconds: number) {
  logger.info("TTS generation completed", {
    conversationId,
    durationSeconds,
    estimatedCost: durationSeconds * 0.000016, // Google TTS pricing
    timestamp: new Date().toISOString(),
  });
}
