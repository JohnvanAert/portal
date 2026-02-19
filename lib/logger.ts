import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";

export async function createAuditLog({
  userId,
  action,
  targetId,
  details
}: {
  userId: string;
  action: string;
  targetId?: string;
  details?: any;
}) {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      targetId: targetId?.toString(),
      details,
    });
  } catch (error) {
    console.error("Ошибка записи лога:", error);
  }
}