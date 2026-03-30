export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BroadcastResult {
  notificationId: string;
  sentCount: number;
  failedCount: number;
}

export interface INotificationService {
  sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<NotificationResult>;

  sendSMS(to: string, body: string): Promise<NotificationResult>;

  /** Trigger send for a notification document (by ID). */
  sendBroadcast(notificationId: string): Promise<BroadcastResult>;
}
