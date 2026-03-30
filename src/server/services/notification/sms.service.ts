/**
 * Twilio SMS service.
 * Fans out via Promise.allSettled — individual sends required by Twilio.
 * At <200 customers, synchronous fan-out is sufficient.
 */
import twilio from "twilio";

import type { NotificationResult } from "./notification.interface";

export class TwilioSMSService {
  private readonly client: twilio.Twilio;
  private readonly from: string;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    this.from = process.env.TWILIO_FROM_NUMBER ?? "";
  }

  async send(to: string, body: string): Promise<NotificationResult> {
    try {
      const message = await this.client.messages.create({
        from: this.from,
        to,
        body,
      });
      return { success: true, messageId: message.sid };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  async sendBatch(
    recipients: string[],
    body: string,
  ): Promise<{ sent: number; failed: number }> {
    const results = await Promise.allSettled(
      recipients.map((to) => this.send(to, body)),
    );

    let sent = 0;
    let failed = 0;
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.success) {
        sent++;
      } else {
        failed++;
      }
    }
    return { sent, failed };
  }
}
