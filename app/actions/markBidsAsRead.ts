"use server";

import { db } from "@/lib/db";
import { bids } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function markAllBidsAsRead() {
  try {
    await db.update(bids)
      .set({ isRead: true })
      .where(eq(bids.isRead, false)); // Помечаем только те, что еще не прочитаны
    return { success: true };
  } catch (error) {
    console.error("Failed to update bids:", error);
    return { success: false };
  }
}

export async function markWinnerBidsAsRead(vendorName: string) {
  try {
    await db.update(bids)
      .set({ isWinnerRead: true })
      .where(and(eq(bids.vendorName, vendorName), eq(bids.isWinnerRead, false)));
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}