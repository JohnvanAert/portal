"use server";

import { db } from "@/lib/db";
import { tenders } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function selectWinner(tenderId: number, bidId: number) {
  try {
    await db.update(tenders)
      .set({ 
        status: 'Завершен', 
        winnerId: bidId 
      })
      .where(eq(tenders.id, tenderId));

    revalidatePath(`/admin/dashboard/tenders/${tenderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error selecting winner:", error);
    return { success: false };
  }
}