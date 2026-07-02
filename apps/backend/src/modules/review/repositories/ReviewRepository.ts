/**
 * @file apps/backend/src/modules/review/repositories/ReviewRepository.ts
 * Prisma data access for ReviewItem.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { ReviewItem, Prisma } from "@prisma/client";

export class ReviewRepository {
  async findDueItems(
    userId: string,
    itemTypePrefix: string,
    limit: number = 10,
  ): Promise<ReviewItem[]> {
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

  async findRecentItems(
    userId: string,
    itemTypePrefix: string,
    limit: number = 10,
    days: number = 7,
  ): Promise<ReviewItem[]> {
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

  async findByUserAndItem(
    userId: string,
    itemType: string,
    itemId: string,
  ): Promise<ReviewItem | null> {
    return prisma.reviewItem.findUnique({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
    });
  }

  /**
   * Find review items by user and a list of item types.
   */
  async findByUserAndTypes(userId: string, itemTypes: string[]): Promise<ReviewItem[]> {
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
  async findById(id: string): Promise<ReviewItem | null> {
    return prisma.reviewItem.findUnique({ where: { id } });
  }

  /**
   * Create a new review item.
   */
  async create(data: Prisma.ReviewItemCreateInput): Promise<ReviewItem> {
    return prisma.reviewItem.create({ data });
  }

  /**
   * Update a review item's study fields by primary key.
   */
  async update(id: string, data: Prisma.ReviewItemUpdateInput): Promise<ReviewItem> {
    return prisma.reviewItem.update({
      where: { id },
      data,
    });
  }

  async upsert(
    userId: string,
    itemType: string,
    itemId: string,
    data: {
      studyCount?: number;
      correctCount?: number;
      lastReviewed?: Date;
      nextReview?: Date;
      intervalDays?: number;
      source?: string;
    },
  ): Promise<ReviewItem> {
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
        source: data.source || "viewed",
      },
    });
  }

  async countDue(userId: string, itemTypePrefix: string): Promise<number> {
    return prisma.reviewItem.count({
      where: {
        userId,
        nextReview: { lte: new Date() },
        itemType: { startsWith: itemTypePrefix },
      },
    });
  }
}
