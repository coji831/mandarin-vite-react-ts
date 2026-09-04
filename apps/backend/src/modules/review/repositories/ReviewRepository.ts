/**
 * @file apps/backend/src/modules/review/repositories/ReviewRepository.ts
 * @description Prisma data access for SRS scheduling state.
 *
 * Story 24-11 (Review Port + SRS Schema): RE-POINTED from the legacy
 * `ReviewItem` table to the absorbed additive `SrsCardState` table (Epic 24-11
 * schema — 4-state `SrsState` enum + reserved pgvector column). Interval-
 * doubling semantics are PRESERVED at the service layer (again=1d / good=
 * double / easy=triple, capped 60d) — FSRS scheduling is epic-34, NOT here.
 *
 * `ReviewItem` is kept INTACT (additive-only migration) and stays live until
 * the epic-28/34 destructive cleanup; this repository no longer reads/writes
 * it for SRS state.
 *
 * P0-1 (Story 24-1 stopgap + Story 24-11 structural): `findByUserAndTypes` /
 * `countDue` structurally reject `undefined` userId BEFORE any Prisma call.
 * Prisma silently drops `undefined` where-keys, so `where: { userId:
 * undefined }` would return EVERY user's rows. Returning an empty array / 0
 * here guarantees no ignore-`undefined` path survives on any optionalAuth SRS
 * read — a guest never sees another user's rows. In Nest land the calibrated
 * `RequireAuthGuard` (24-5) additionally blocks guests at the HTTP boundary
 * (401 before the controller), so `undefined` cannot reach this repository
 * through a route; this check is defense-in-depth shared with the Express path.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { SrsCardState, Prisma } from "@prisma/client";

export class ReviewRepository {
  async findDueItems(
    userId: string,
    itemTypePrefix: string,
    limit: number = 10,
  ): Promise<SrsCardState[]> {
    return prisma.srsCardState.findMany({
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
  ): Promise<SrsCardState[]> {
    const since = new Date(Date.now() - days * 86400000);
    return prisma.srsCardState.findMany({
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
  ): Promise<SrsCardState | null> {
    return prisma.srsCardState.findUnique({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
    });
  }

  /**
   * Find SRS scheduling state by user and a list of item types.
   *
   * P0-1 (Story 24-1 + 24-11): structurally reject `undefined` userId BEFORE
   * any Prisma call. Prisma silently drops `undefined` where-keys, so
   * `where: { userId: undefined }` would return EVERY user's rows. Returning
   * an empty array here guarantees no ignore-`undefined` path survives on any
   * optionalAuth SRS read — a guest never sees another user's rows.
   */
  async findByUserAndTypes(
    userId: string | undefined,
    itemTypes: string[],
  ): Promise<SrsCardState[]> {
    if (userId === undefined) {
      return [];
    }
    return prisma.srsCardState.findMany({
      where: {
        userId,
        itemType: { in: itemTypes },
      },
      orderBy: { nextReview: "asc" },
    });
  }

  /**
   * Find a single SRS scheduling row by its primary key.
   */
  async findById(id: string): Promise<SrsCardState | null> {
    return prisma.srsCardState.findUnique({ where: { id } });
  }

  /**
   * Create a new SRS scheduling row.
   */
  async create(data: Prisma.SrsCardStateCreateInput): Promise<SrsCardState> {
    return prisma.srsCardState.create({ data });
  }

  /**
   * Update an SRS scheduling row's study fields by primary key.
   */
  async update(id: string, data: Prisma.SrsCardStateUpdateInput): Promise<SrsCardState> {
    return prisma.srsCardState.update({
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
  ): Promise<SrsCardState> {
    return prisma.srsCardState.upsert({
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

  /**
   * Count SRS scheduling rows due for a user.
   *
   * P0-1 (Story 24-1 + 24-11): same structural `undefined`-userId rejection as
   * findByUserAndTypes — `prisma.srsCardState.count({ where: { userId:
   * undefined } })` would count EVERY user's due rows. Return 0 instead.
   */
  async countDue(userId: string | undefined, itemTypePrefix: string): Promise<number> {
    if (userId === undefined) {
      return 0;
    }
    return prisma.srsCardState.count({
      where: {
        userId,
        nextReview: { lte: new Date() },
        itemType: { startsWith: itemTypePrefix },
      },
    });
  }
}
