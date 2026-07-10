import { notifications } from "./marketplace-data";

export type SimulatedNotification = {
  id: string;
  channel: "email" | "whatsapp" | "dashboard";
  recipient: string;
  message: string;
  status: "queued" | "sent_simulated";
  createdAt: string;
  source: "checkout" | "cashier" | "system";
};

export const notificationsStorageKey = "waptek-notifications";
export const notificationsChangedEvent = "waptek-notifications-changed";

export const defaultNotificationLog: SimulatedNotification[] = notifications.map((notification) => ({
  ...notification,
  createdAt: "2026-07-07 09:00",
  source: "system",
}));

export function readNotificationLog() {
  if (typeof window === "undefined") return defaultNotificationLog;

  const value = window.localStorage.getItem(notificationsStorageKey);
  if (!value) return defaultNotificationLog;

  try {
    return JSON.parse(value) as SimulatedNotification[];
  } catch {
    return defaultNotificationLog;
  }
}

export function writeNotificationLog(log: SimulatedNotification[]) {
  window.localStorage.setItem(notificationsStorageKey, JSON.stringify(log));
  window.dispatchEvent(new Event(notificationsChangedEvent));
}

export function appendNotifications(entries: Omit<SimulatedNotification, "id" | "createdAt">[]) {
  const timestamp = new Date().toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const newEntries = entries.map((entry, index) => ({
    ...entry,
    id: `note-${Date.now()}-${index}`,
    createdAt: timestamp,
  }));

  const nextLog = [...newEntries, ...readNotificationLog()];
  writeNotificationLog(nextLog);
  return newEntries;
}
