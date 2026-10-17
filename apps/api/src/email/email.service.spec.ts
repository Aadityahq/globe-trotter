jest.mock("nodemailer");

import { ConfigService } from "@nestjs/config";
import { EmailService } from "./email.service"
import { Test, TestingModule } from "@nestjs/testing";
import { createTransport } from "nodemailer";
import renderPasswordResetEmail from "./emailTemplates/renderPasswordResetEmail";

const URLOrigin = "http://localhost:4000";

describe("EmailService", () => {
  let service: EmailService;
  let configService: Partial<ConfigService>;
  let mockCreateTransport: jest.MockedFunction<typeof createTransport>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("with EMAIL_PROVIDER=stub", () => {
    beforeEach(async () => {
      mockCreateTransport = createTransport as jest.MockedFunction<typeof createTransport>;

      configService = {
        get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
          switch (key) {
            case "EMAIL_PROVIDER":
              return "stub";
            case "EMAIL_FROM":
              return "noreply@localhost";
            default:
              return defaultValue;
          }
        }),
      }

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it("does not throw when EMAIL_PROVIDER is stub", async () => {
      await expect(
        service.sendVerificationEmail("test1@example.dev", URLOrigin + "/verify")
      ).resolves.toBeUndefined();
    });

    it("does not attempt a network call", async () => {
      //? Watch for console.warn() calls - should warn if no provider set up (i.e. EMAIL_PROVIDER=stub)
      const logSpy = jest.spyOn((service as any).logger, "log").mockImplementation();
      await service.sendVerificationEmail("test1@example.dev", URLOrigin + "/verify");
      expect(logSpy).toHaveBeenCalled();
    });

    it("logs the password reset email instead of sending it", async () => {
      const logSpy = jest.spyOn((service as any).logger, "log").mockImplementation();
      await expect(
        service.sendPasswordResetEmail("test1@example.dev", URLOrigin + "/api/auth/reset-password/token")
      ).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Reset your password"));
    });

    it("rejects a password reset URL with an unexpected origin", async () => {
      await expect(
        service.sendPasswordResetEmail("test1@example.dev", "https://evil.example/api/auth/reset-password/token")
      ).rejects.toThrow("Password reset URL does not match expected origin");
    });
  });

  describe("with EMAIL_PROVIDER=smtp", () => {
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: "test-message-id" });
    
    beforeEach(async () => {
      mockCreateTransport = createTransport as jest.MockedFunction<typeof createTransport>;
      mockCreateTransport.mockReturnValue({ sendMail: mockSendMail } as any);

      configService = {
        get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
          switch (key) {
            case "EMAIL_PROVIDER":
              return "smtp";
            case "EMAIL_FROM":
              return "noreply@localhost";
            case "SMTP_HOST":
              return "localhost";
            case "SMTP_PORT":
              return 1025;
            default:
              return defaultValue;
          }
        }),
      }

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it("calls nodemailer sendMail when EMAIL_PROVIDER is smtp", async () => {
      await service.sendVerificationEmail("test1@example.dev", URLOrigin + "/verify?token=test");

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@localhost",
          to: "test1@example.dev",
          subject: "Verify your email address",
        })
      );
    });

    // In case somebody changes the SMTP config without realizing
    it("createTransport is configured correctly", async () => {
      await service.sendVerificationEmail("test1@example.dev", URLOrigin + "/verify?token=test");

      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: "localhost",
        port: 1025,
        secure: false,
      })
    });

    it("sends the password reset email via nodemailer", async () => {
      const url = URLOrigin + "/api/auth/reset-password/test-token?callbackURL=";
      await service.sendPasswordResetEmail("test1@example.dev", url);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@localhost",
          to: "test1@example.dev",
          subject: "Reset your password",
          text: expect.stringContaining(url),
          html: expect.stringContaining(url),
        })
      );
    });
  });
});

describe("renderPasswordResetEmail", () => {
  it.each(["javascript:alert(1)", "data:text/html,x", "//evil.example/reset"])(
    "rejects a non-http(s) URL: %s",
    (url) => {
      expect(() => renderPasswordResetEmail(url)).toThrow("Password reset URL must use http or https.");
    },
  );

  it("renders an http(s) URL into the email", () => {
    const url = URLOrigin + "/api/auth/reset-password/token";
    expect(renderPasswordResetEmail(url)).toContain(`href="${url}"`);
  });

  it("HTML-escapes the URL so it cannot break out of the href attribute", () => {
    const html = renderPasswordResetEmail(URLOrigin + '/reset"><script>alert(1)</script>');

    expect(html).not.toContain("<script>");
    expect(html).toContain(`href="${URLOrigin}/reset&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"`);
  });
});
