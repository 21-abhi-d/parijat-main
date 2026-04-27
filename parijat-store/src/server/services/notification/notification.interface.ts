export type NotificationTopic = "restock" | "events" | "sales";

export interface IBroadcastOptions {
  subject: string;
  body: string;
  topic?: NotificationTopic;
}

export interface INotificationService {
  /** Send a targeted restock alert to customers who wishlisted the product. */
  sendRestock(productId: string, productName: string): Promise<number>;

  /** Send a broadcast to all email-opted-in customers matching the topic. */
  sendBroadcast(opts: IBroadcastOptions): Promise<number>;
}
