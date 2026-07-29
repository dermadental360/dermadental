import { prisma } from "./prisma";

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
  } catch (err: any) {
    console.warn("Failed to write audit log to database:", err?.message || err);
  }
}
