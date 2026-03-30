import type { INotificationService } from "./notification.interface";
import { NotificationService } from "./notification.service";
import { ResendEmailService } from "./email.service";
import { TwilioSMSService } from "./sms.service";

export function createNotificationService(): INotificationService {
  return new NotificationService(
    new ResendEmailService(),
    new TwilioSMSService(),
  );
}

export type { INotificationService, BroadcastResult, NotificationResult } from "./notification.interface";
