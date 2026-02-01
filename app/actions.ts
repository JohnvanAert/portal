'use server'

import { db } from '@/lib/db';
import { tenders, bids } from '@/lib/schema';
import { revalidatePath } from 'next/cache';
import { auth } from "@/auth";

/**
 * Создание нового тендера (Логика Заказчика)
 */
export async function createTender(formData: FormData) {
  const title = formData.get('title') as string;
  const price = formData.get('price') as string;
  const type = formData.get('type') as string;

  // Вставляем данные в таблицу тендеров
  await db.insert(tenders).values({ 
    title, 
    price, 
    type,
    status: "Активен" // Устанавливаем статус по умолчанию
  });
  
  // Очищаем кэш страниц, чтобы новые данные подтянулись везде
  revalidatePath('/');
  revalidatePath('/dashboard');
}

/**
 * Подача отклика на тендер (Логика Поставщика)
 */
export async function createBid(formData: FormData) {
  // 1. Получаем сессию на сервере
  const session = await auth();

  // Проверка: если пользователь не залогинен, не даем создать отклик
  if (!session?.user?.id) {
    return { error: "Вы должны быть авторизованы, чтобы подать заявку" };
  }

  // 2. Извлекаем данные из формы
  const tenderId = Number(formData.get('tenderId'));
  const vendorName = formData.get('vendorName') as string;
  const offerPrice = formData.get('offerPrice') as string;
  const message = formData.get('message') as string;

  try {
    // 3. Вставляем данные в БД
    await db.insert(bids).values({
      tenderId,
      userId: session.user.id, // Теперь userId берется из сессии и TypeScript будет доволен
      vendorName,
      offerPrice,
      message,
      // isRead и isWinnerRead заполнятся автоматически из default(false) в схеме
    });

    // Очищаем кэш, чтобы данные обновились в интерфейсе
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error("Error creating bid:", error);
    return { error: "Не удалось отправить отклик" };
  }
}