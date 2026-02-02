"use server";

import { db } from "@/lib/db";
import { bids } from "@/lib/schema";
import { inArray, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Универсальная функция для пометки конкретных заявок как прочитанных
export async function markSpecificBidsAsRead(bidIds: number[]) {
  if (bidIds.length === 0) return { success: true };

  try {
    await db.update(bids)
      .set({ 
        isRead: true,       // Для админа
        isWinnerRead: true  // Для поставщика
      })
      .where(inArray(bids.id, bidIds));
    
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error("Ошибка БД:", error);
    return { success: false };
  }
}

// Старый метод для админа можно оставить или заменить на новый
export async function markAllBidsAsRead() {
  try {
    await db.update(bids).set({ isRead: true }).where(eq(bids.isRead, false));
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}