import { jest } from "@jest/globals";

jest.mock("@repo/database", () => ({
  db: { __mock: true },
}));

jest.mock("@better-auth/drizzle-adapter", () => ({
  drizzleAdapter: jest.fn(() => ({ __adapterMock: true })),
}));

jest.mock("better-auth/minimal", () => ({
  betterAuth: jest.fn((config) => ({ config })),
}));

import { betterAuth } from "better-auth/minimal";
import { createAuth } from "./auth";
import type { EmailService } from "../email/email.service";

describe("Better Auth session configuration", () => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    WEB_URL: process.env.WEB_URL,
  };

  const emailService = {
    sendDuplicateSignUpNotice: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
  } as unknown as EmailService;

  let config: Record<string, any>;

  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.EMAIL_PROVIDER = "stub";
    process.env.BETTER_AUTH_SECRET = "test-secret-for-unit-tests-only";
    process.env.BETTER_AUTH_URL = "http://localhost:4000";
    process.env.WEB_URL = "http://localhost:3000";

    const auth = createAuth(emailService);
    config = (auth as unknown as { config: Record<string, any> }).config;
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("configures a seven-day session expiry", () => {
    expect(config.session.expiresIn).toBe(7 * 24 * 60 * 60);
  });

  it("configures session update age to one day", () => {
    expect(config.session.updateAge).toBe(24 * 60 * 60);
  });

  it("configures HTTP-only and same-site cookie attributes", () => {
    expect(config.advanced.defaultCookieAttributes).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
  });


  it("enables secure cookies in production", () => {
    process.env.NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "resend";

    try {
      createAuth(emailService);

      const calls = jest.mocked(betterAuth).mock.calls;
      const productionCall = calls[calls.length - 1];

      expect(productionCall).toBeDefined();

      const productionConfig = productionCall![0] as {
        advanced: {
          defaultCookieAttributes: {
            secure: boolean;
          };
        };
      };

      expect(
        productionConfig.advanced.defaultCookieAttributes.secure,
      ).toBe(true);
    } finally {
      process.env.NODE_ENV = "test";
      process.env.EMAIL_PROVIDER = "stub";
    }
  });
});
