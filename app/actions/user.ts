'use server'

import { db } from "@/lib/db";
import { users, organizations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Не авторизован" };

  const name = formData.get("name") as string;
  const iin = formData.get("iin") as string;
  const orgName = formData.get("orgName") as string;
  const bin = formData.get("bin") as string;

  try {
    // 1. Обновляем данные пользователя
    await db.update(users)
      .set({ name, iin })
      .where(eq(users.id, session.user.id));

    // 2. Если это поставщик, обновляем данные организации
    if (session.user.role === 'vendor') {
      await db.update(organizations)
        .set({ name: orgName, bin: bin })
        .where(eq(organizations.userId, session.user.id));
    }

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при обновлении данных" };
  }
}