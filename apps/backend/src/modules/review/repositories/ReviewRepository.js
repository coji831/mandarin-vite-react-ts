/**
 * @file apps/backend/src/modules/review/repositories/ReviewRepository.js
 * Prisma data access for ReviewItem.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";

export class ReviewRepository {
  async findDueItems(userId, itemTypePrefix, limit = 10) {
    return prisma.reviewItem.findMany({
      where: {
        userId,
        nextReview: { lte: new Date() },
        itemType: { startsWith: itemTypePrefix },
      },
      orderBy: { nextReview: "asc" },
      take: limit,
    });
  }

  async findRecentItems(userId, itemTypePrefix, limit = 10, days = 7) {
    const since = new Date(Date.now() - days * 86400000);
    return prisma.reviewItem.findMany({
      where: {
        userId,
        lastReviewed: { gte: since },
        itemType: { startsWith: itemTypePrefix },
      },
      orderBy: { lastReviewed: "desc" },
      take: limit,
    });
  }

  async findByUserAndItem(userId, itemType, itemId) {
    return prisma.reviewItem.findUnique({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
    });
  }

  /**
   * Find review items by user and a list of item types.
   */
  async findByUserAndTypes(userId, itemTypes) {
    return prisma.reviewItem.findMany({
      where: {
        userId,
        itemType: { in: itemTypes },
      },
      orderBy: { nextReview: "asc" },
    });
  }

  /**
   * Find a single review item by its primary key.
   */
  async findById(id) {
    return prisma.reviewItem.findUnique({ where: { id } });
  }

  /**
   * Create a new review item.
   */
  async create(data) {
    return prisma.reviewItem.create({ data });
  }

  /**
   * Update a review item's study fields by primary key.
   */
  async update(id, data) {
    return prisma.reviewItem.update({
      where: { id },
      data,
    });
  }

  async upsert(userId, itemType, itemId, data) {
    return prisma.reviewItem.upsert({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
      update: {
        studyCount: data.studyCount,
        correctCount: data.correctCount,
        lastReviewed: data.lastReviewed,
        nextReview: data.nextReview,
        intervalDays: data.intervalDays,
      },
      create: {
        userId,
        itemType,
        itemId,
        studyCount: data.studyCount,
        correctCount: data.correctCount,
        lastReviewed: data.lastReviewed,
        nextReview: data.nextReview,
        intervalDays: data.intervalDays,
      },
    });
  }

  async countDue(userId, itemTypePrefix) {
    return prisma.reviewItem.count({
      where: {
        userId,
        nextReview: { lte: new Date() },
        itemType: { startsWith: itemTypePrefix },
      },
    });
  }
}
