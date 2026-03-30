/**
 * Notification orchestrator.
 * Queries opted-in customers, fans out via email/SMS adapters,
 * and updates the Notification document status.
 */
import { connectDB } from "~/server/db/client";
import { CustomerModel } from "~/server/db/models/customer.model";
import { NotificationModel } from "~/server/db/models/notification.model";
import { ResendEmailService } from "./email.service";
import type {
  BroadcastResult,
  INotificationService,
  NotificationResult,
} from "./notification.interface";
import { TwilioSMSService } from "./sms.service";

export class NotificationService implements INotificationService {
  constructor(
    private readonly email: ResendEmailService,
    private readonly sms: TwilioSMSService,
  ) {}

  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<NotificationResult> {
    return this.email.send(to, subject, html);
  }

  async sendSMS(to: string, body: string): Promise<NotificationResult> {
    return this.sms.send(to, body);
  }

  async sendBroadcast(notificationId: string): Promise<BroadcastResult> {
    await connectDB();

    const notification = await NotificationModel.findById(notificationId);
    if (!notification) throw new Error("Notification not found");

    // Mark as sending
    notification.status = "sending";
    await notification.save();

    try {
      let sentCount = 0;
      let failedCount = 0;

      // ── Email fan-out ────────────────────────────────────────────────────
      if (
        notification.channel === "email" ||
        notification.channel === "both"
      ) {
        const emailFilter = this.buildRecipientFilter(notification, "email");
        const emailCustomers = await CustomerModel.find(emailFilter, {
          email: 1,
        }).lean();
        const emailAddresses = emailCustomers.map((c) => c.email);

        if (emailAddresses.length > 0) {
          const subject = notification.subject ?? "News from Parijat Boutique";
          const result = await this.email.sendBatch(
            emailAddresses,
            subject,
            this.wrapEmailBody(notification.body),
          );
          sentCount += result.sent;
          failedCount += result.failed;
        }
      }

      // ── SMS fan-out ──────────────────────────────────────────────────────
      if (
        notification.channel === "sms" ||
        notification.channel === "both"
      ) {
        const smsFilter = this.buildRecipientFilter(notification, "sms");
        const smsCustomers = await CustomerModel.find(smsFilter, {
          phone: 1,
        }).lean();
        const phoneNumbers = smsCustomers
          .map((c) => c.phone)
          .filter((p): p is string => Boolean(p));

        if (phoneNumbers.length > 0) {
          const result = await this.sms.sendBatch(phoneNumbers, notification.body);
          sentCount += result.sent;
          failedCount += result.failed;
        }
      }

      // Update notification status
      notification.status = "sent";
      notification.sentAt = new Date();
      notification.sentCount = sentCount;
      notification.failedCount = failedCount;
      await notification.save();

      return { notificationId, sentCount, failedCount };
    } catch (e) {
      notification.status = "failed";
      await notification.save();
      throw e;
    }
  }

  private buildRecipientFilter(
    notification: { recipientType: string; type: string },
    channel: "email" | "sms",
  ): Record<string, unknown> {
    const base: Record<string, unknown> = { role: "customer" };

    if (channel === "email") base["notifications.emailOptIn"] = true;
    if (channel === "sms") base["notifications.smsOptIn"] = true;

    // Add preference filter for typed notifications
    if (notification.type !== "custom") {
      const prefKey = `notifications.preferences.${notification.type}` as string;
      base[prefKey] = true;
    }

    return base;
  }

  private wrapEmailBody(body: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Georgia, serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f97316; font-size: 24px;">Parijat Boutique</h1>
          <div style="line-height: 1.6;">${body}</div>
          <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
          <p style="font-size: 12px; color: #78716c;">
            You're receiving this because you opted in to notifications from Parijat Boutique.
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="color: #f97316;">Manage preferences</a>
          </p>
        </body>
      </html>
    `;
  }
}
