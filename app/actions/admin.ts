'use server'

import { db } from "@/lib/db";
import { users, auditLogs, organizations } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth"; // Предполагается, что у вас настроен NextAuth

export async function updateUserRole(targetUserId: string, newRole: "admin" | "vendor" | "customer") {
  const session = await auth();
  
  // Проверка: только админ может менять роли
  if (!session || session.user.role !== "admin") {
    return { error: "Доступ запрещен" };
  }

  try {
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!targetUser) return { error: "Пользователь не найден" };

    await db.transaction(async (tx) => {
      // 1. Обновляем роль пользователя
      await tx.update(users)
        .set({ role: newRole })
        .where(eq(users.id, targetUserId));

      // 2. Записываем действие в аудит
      await tx.insert(auditLogs).values({
        userId: session.user.id,
        action: "ROLE_CHANGE",
        details: {
          userEmail: targetUser.email,
          oldRole: targetUser.role,
          newRole: newRole,
          timestamp: new Date().toISOString()
        },
      });
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Admin Action Error:", error);
    return { error: "Ошибка при обновлении роли" };
  }
}

export async function getAdminStats() {
  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [vendors] = await db.select({ count: sql<number>`count(*)` }).from(users).where(sql`role = 'vendor'`);
  const [admins] = await db.select({ count: sql<number>`count(*)` }).from(users).where(sql`role = 'admin'`);
  const [totalOrgs] = await db.select({ count: sql<number>`count(*)` }).from(organizations);

  return {
    totalUsers: totalUsers.count,
    vendors: vendors.count,
    admins: admins.count,
    totalOrgs: totalOrgs.count
  };
}

export async function getRegistrationStats() {
  // Получаем количество регистраций по дням за последнюю неделю
  const stats = await db.execute(sql`
    SELECT 
      to_char(created_at, 'DD.MM') as date,
      count(*) as count
    FROM users
    WHERE created_at > now() - interval '7 days'
    GROUP BY date
    ORDER BY date ASC
  `);

  return stats.rows as { date: string, count: number }[];
}