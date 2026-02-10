"use server";

import { db } from "@/lib/db";
import { tenders } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateTender(id: number, data: any) {
  try {
    await db.update(tenders)
      .set({
        title: data.title,
        category: data.category,
        price: data.price,
        status: data.status,
        description: data.description,
        // Добавь другие поля, если они есть в схеме
      })
      .where(eq(tenders.id, id));

    revalidatePath(`/admin/dashboard/tenders/${id}`);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Ошибка при обновлении" };
  }
}