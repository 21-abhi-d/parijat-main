import { Resend } from "resend";

import { env } from "~/env";

// Lazily instantiated — only created when first used, so missing RESEND_API_KEY
// doesn't crash the app at startup.
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  resend ??= new Resend(env.RESEND_API_KEY);
  return resend;
}

export interface ISendEmailOptions {
  to: string[];
  subject: string;
  html: string;
}

export async function sendEmail(opts: ISendEmailOptions): Promise<void> {
  const client = getResendClient();
  const from = env.RESEND_FROM_ADDRESS ?? "hello@parijat.com.au";

  // Resend supports batch sending up to 100 recipients per call
  const BATCH_SIZE = 100;
  for (let i = 0; i < opts.to.length; i += BATCH_SIZE) {
    const batch = opts.to.slice(i, i + BATCH_SIZE);
    await client.emails.send({
      from,
      to: batch,
      subject: opts.subject,
      html: opts.html,
    });
  }
}
