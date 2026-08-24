/**
 * @file apps/backend/src/modules/auth/nest/auth-nest.controller.ts
 * @description NestJS controller for the Auth module (Story 24-6 — Auth
 * Module Port).
 *
 * Same body validation, same service delegation, same 2xx JSON, same
 * refresh-token httpOnly cookie semantics (set on register/login/refresh,
 * cleared on logout), and the same refresh-token rotation (the service already
 * rotates; the controller sets the NEW cookie).
 *
 * Route + guard mapping:
 *   - `POST /v1/auth/register` → public (brute-force limiter mounted in
 *     `configure-app.ts`)
 *   - `POST /v1/auth/login`    → public (brute-force limiter mounted in
 *     `configure-app.ts`)
 *   - `POST /v1/auth/refresh`  → public (matches Express — no guard)
 *   - `POST /v1/auth/logout`   → public (matches Express — no guard)
 *   - `GET  /v1/auth/me`       → `@UseGuards(AuthGuard)` (24-5 required auth;
 *     matches Express `authenticateToken`)
 *
 * 4xx/5xx are thrown as `HttpException`s carrying the SAME `code` + `message`
 * as the previous surface's `{ error, code, message }` bodies; the global
 * 24-3 `AppExceptionFilter` serializes them into the `{ code, message,
 * requestId }` envelope (the legacy `error` key is superseded by the envelope
 * — the established 24-5 parity contract). `code`/`message` are byte-for-byte
 * equal on every mapped status.
 *
 * Cookie access: `cookie-parser` (configure-app.ts) populates
 * `req.cookies.refreshToken`; `@Res({ passthrough: true })` hands the Express
 * response through so `res.cookie()`/`res.clearCookie()` set the same httpOnly
 * `refreshToken` cookie while Nest still serializes the returned body.
 */

import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { createLogger } from "../../../shared/utils/logger.js";
import { config } from "../../../shared/config/index.js";
import { AuthService } from "../services/AuthService.js";
import { AuthGuard } from "../../../nest/guards/auth-guard.js";

const logger = createLogger("AuthNestController");

/**
 * NestJS controller for authentication operations (Story 24-6).
 */
@Controller("v1/auth")
export class AuthNestController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  /**
   * Helper to set refresh token cookie with consistent settings — identical
   * to `AuthController.setRefreshTokenCookie` (Express).
   */
  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProduction = config.nodeEnvironment === "production";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /**
   * Helper to clear refresh token cookie with matching settings — identical
   * to `AuthController.clearRefreshTokenCookie` (Express).
   */
  private clearRefreshTokenCookie(res: Response): void {
    const isProduction = config.nodeEnvironment === "production";
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
  }

  /**
   * Register new user
   * POST /api/v1/auth/register
   * Body: { email, password, displayName? }
   */
  @Post("register")
  async register(
    @Body() body: { email?: string; password?: string; displayName?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    const { email, password, displayName } = body ?? {};

    if (!email || !password) {
      throw new BadRequestException({
        code: "MISSING_FIELDS",
        message: "Email and password are required",
      });
    }

    try {
      const result = await this.authService.register(email, password, displayName);

      logger.info("User registered successfully", { email, ip: req.ip });

      // Set refresh token as httpOnly cookie
      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      return {
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message === "User already exists") {
        logger.warn("Registration failed - user exists", { email, ip: req.ip });
        throw new ConflictException({
          code: "USER_EXISTS",
          message: "A user with this email already exists",
        });
      }

      if (err.message.includes("Password must be")) {
        logger.warn("Registration failed - weak password", { email, ip: req.ip });
        throw new BadRequestException({ code: "INVALID_PASSWORD", message: err.message });
      }

      logger.error("Failed to register user", { error: err.message, email, ip: req.ip });
      throw new InternalServerErrorException({
        code: "REGISTRATION_FAILED",
        message: "An unexpected error occurred",
      });
    }
  }

  /**
   * Login existing user
   * POST /api/v1/auth/login
   * Body: { email, password }
   */
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: { email?: string; password?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    const { email, password } = body ?? {};

    if (!email || !password) {
      throw new BadRequestException({
        code: "MISSING_FIELDS",
        message: "Email and password are required",
      });
    }

    try {
      const result = await this.authService.login(email, password);

      logger.info("User logged in successfully", { email, ip: req.ip });

      // Set refresh token as httpOnly cookie
      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      return {
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message === "Invalid credentials") {
        logger.warn("Login failed - invalid credentials", {
          email,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });
        throw new UnauthorizedException({
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        });
      }

      logger.error("Failed to authenticate", { error: err.message, email, ip: req.ip });
      throw new InternalServerErrorException({
        code: "LOGIN_FAILED",
        message: "An unexpected error occurred",
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   * Cookie: refreshToken
   */
  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException({
        code: "MISSING_TOKEN",
        message: "Refresh token is required",
      });
    }

    try {
      const tokens = await this.authService.refresh(refreshToken);

      // Set new refresh token as httpOnly cookie (rotation)
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      return {
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message === "Invalid refresh token") {
        throw new UnauthorizedException({
          code: "INVALID_TOKEN",
          message: "Invalid or expired refresh token",
        });
      }

      logger.error("Failed to refresh session", { error: err.message });
      throw new InternalServerErrorException({
        code: "REFRESH_FAILED",
        message: "An unexpected error occurred",
      });
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   * Cookie: refreshToken
   */
  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      // Even if no token, still clear the cookie
      this.clearRefreshTokenCookie(res);
      throw new BadRequestException({
        code: "MISSING_REFRESH_TOKEN",
        message: "Refresh token is required",
      });
    }

    try {
      await this.authService.logout(refreshToken);

      // Clear the httpOnly cookie using helper
      this.clearRefreshTokenCookie(res);

      return {
        success: true,
        message: "Logged out successfully",
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to sign out", { error: err.message });
      // Always try to clear cookie even on error
      this.clearRefreshTokenCookie(res);
      throw new InternalServerErrorException({ code: "LOGOUT_FAILED" });
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   * Headers: { Authorization: Bearer <token> }
   * Guard: AuthGuard (24-5 required auth — attaches req.userId)
   */
  @Get("me")
  @UseGuards(AuthGuard)
  async getCurrentUser(@Req() req: Request): Promise<unknown> {
    const userId = req.userId as string;

    const user = await this.authService.getUserById(userId).catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to load user profile", { error: err.message });
      throw new InternalServerErrorException({ code: "PROFILE_LOAD_FAILED" });
    });

    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      success: true,
      data: { user },
    };
  }
}
