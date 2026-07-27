import { EventEmitter } from "events";

class AdminEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}

const globalForAdminBus = globalThis as unknown as {
  adminEventBus?: AdminEventBus;
};

export const adminEventBus =
  globalForAdminBus.adminEventBus ?? new AdminEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForAdminBus.adminEventBus = adminEventBus;
}

export type AdminEventType =
  | "ORDER_NEW"
  | "ORDER_STATUS_UPDATED"
  | "INQUIRY_NEW"
  | "REVIEW_NEW"
  | "PAYMENT_SUCCESS"
  | "NOTIFICATION_NEW";

export interface AdminEventData {
  type: AdminEventType;
  payload: any;
  timestamp: string;
}

export function broadcastAdminEvent(type: AdminEventType, payload: any) {
  const eventData: AdminEventData = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
  adminEventBus.emit("admin_event", eventData);
}
