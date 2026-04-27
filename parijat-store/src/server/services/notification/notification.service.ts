import { CustomerModel } from "~/server/db/models/customer.model";
import { sendEmail } from "./email.service";
import { type IBroadcastOptions, type INotificationService } from "./notification.interface";

class NotificationService implements INotificationService {
  async sendRestock(productId: string, productName: string): Promise<number> {
    const subscribers = await CustomerModel.find({
      "wishlist.productId": productId,
      "notifications.email": true,
    })
      .select("email")
      .lean();

    if (!subscribers.length) return 0;

    const emails = subscribers.map((s) => s.email);
    await sendEmail({
      to: emails,
      subject: `${productName} is back in stock`,
      html: `<p>Good news — <strong>${productName}</strong> is back in stock at Parijat.</p>
             <p>Visit our store to view it.</p>`,
    });

    return emails.length;
  }

  async sendBroadcast(opts: IBroadcastOptions): Promise<number> {
    const filter: Record<string, unknown> = { "notifications.email": true };
    if (opts.topic) {
      filter["notifications.topics"] = opts.topic;
    }

    const customers = await CustomerModel.find(filter).select("email").lean();
    if (!customers.length) return 0;

    const emails = customers.map((c) => c.email).filter(Boolean);
    if (emails.length) {
      await sendEmail({
        to: emails,
        subject: opts.subject,
        html: `<p>${opts.body.replace(/\n/g, "<br>")}</p>`,
      });
    }

    return customers.length;
  }
}

export const notificationService = new NotificationService();
