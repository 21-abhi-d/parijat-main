import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Auth
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    ADMIN_EMAIL: z.string().email(),
    ADMIN_PASSWORD_HASH: z.string(),

    // Database
    MONGODB_URI: z.string().url(),

    // AWS
    AWS_REGION: z.string().default("ap-southeast-2"),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET_NAME: z.string(),
    CLOUDFRONT_URL: z.string().url(),

    // Resend (email)
    RESEND_API_KEY: z.string(),
    RESEND_FROM_ADDRESS: z.string().email(),

    // Twilio (SMS)
    TWILIO_ACCOUNT_SID: z.string(),
    TWILIO_AUTH_TOKEN: z.string(),
    TWILIO_FROM_NUMBER: z.string(),

    // Cal.com
    CALCOM_WEBHOOK_SECRET: z.string(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_CALCOM_LINK: z.string(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z
      .string()
      .url()
      .optional()
      .default("https://app.posthog.com"),
  },

  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    MONGODB_URI: process.env.MONGODB_URI,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    CLOUDFRONT_URL: process.env.CLOUDFRONT_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_ADDRESS: process.env.RESEND_FROM_ADDRESS,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
    CALCOM_WEBHOOK_SECRET: process.env.CALCOM_WEBHOOK_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CALCOM_LINK: process.env.NEXT_PUBLIC_CALCOM_LINK,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
