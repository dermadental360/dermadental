import { prisma } from "./prisma";
import { fallbackStore } from "./fallbackStore";

export async function logAction(action: string, details: string) {
  const timestamp = new Date();
  try {
    await prisma.auditLog.create({
      data: {
        action,
        details,
        timestamp
      }
    });
  } catch (err) {
    console.warn("Failed to write audit log to database, falling back to memory:", err);
    fallbackStore.auditLogs.push({
      _id: "log-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      action,
      details,
      timestamp: timestamp.toISOString()
    });
  }
}
