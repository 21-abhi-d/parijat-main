/**
 * Resend email service.
 * Batches sends in chunks of 100 (Resend API limit per batch call).
 */
import { Resend } from "resend";

import type { NotificationResult } from "./notification.interface";

export class ResendEmailService {
  private readonly client: Resend;
  private readonly from: string;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
    this.from =
      process.env.RESEND_FROM_ADDRESS ?? "hello@parijat.com.au";
  }

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<NotificationResult> {
    try {
      const result = await this.client.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      return { success: !result.error, messageId: result.data?.id, error: result.error?.message };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  /** Fan out to multiple recipients in batches of 100. */
  async sendBatch(
    recipients: string[],
    subject: string,
    html: string,
  ): Promise<{ sent: number; failed: number }> {
    const BATCH_SIZE = 100;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((to) => this.send(to, subject, html)),
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.success) {
          sent++;
        } else {
          failed++;
        }
      }
    }

    return { sent, failed };
  }
}
