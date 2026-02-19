'use server'

import { db } from '@/lib/db';
import { tenders, bids, auditLogs, users } from '@/lib/schema';
import { revalidatePath } from 'next/cache';
import { auth } from "@/auth";
import { put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
/**
 * Создание нового тендера
 */
export async function createTender(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Вы должны быть авторизованы для создания тендера");
  }

  // 1. Текстовые данные
  const title = formData.get('title') as string;
  const price = formData.get('price') as string;
  const category = formData.get('category') as string;
  const subCategory = formData.get('subCategory') as string;
  const workType = formData.get('workType') as string;
  
  const requirementsRaw = formData.get('requirements') as string;
  const requirements = requirementsRaw ? JSON.parse(requirementsRaw) : [];

  // 2. Файлы из FormData
  const smetaFile = formData.get('smetaFile') as File;
  const volumeFile = formData.get('volumeFile') as File;

  let attachmentUrl = null;  // Смета
  let attachmentName = null;
  let volumeUrl = null;      // Ведомость объемов
  let volumeName = null;

  try {
    // 3. Загрузка Сметы
    if (smetaFile && smetaFile.size > 0) {
      const smetaBlob = await put(`smeta_${Date.now()}_${smetaFile.name}`, smetaFile, {
        access: 'public',
      });
      attachmentUrl = smetaBlob.url;
      attachmentName = smetaFile.name;
    }

    // 4. Загрузка Ведомости объемов
    if (volumeFile && volumeFile.size > 0) {
      const volumeBlob = await put(`volume_${Date.now()}_${volumeFile.name}`, volumeFile, {
        access: 'public',
      });
      volumeUrl = volumeBlob.url;
      volumeName = volumeFile.name;
    }

    // 5. Сохранение в БД с получением ID
    // Мы добавляем .returning(), чтобы получить ID созданного тендера для логов
    const result = await db.insert(tenders).values({ 
      title, 
      price, 
      category,      
      subCategory,   
      workType,      
      requirements, 
      attachmentUrl,   
      attachmentName,
      volumeUrl,   
      volumeName,  
      status: "Активен" 
    }).returning({ insertedId: tenders.id });

    // Извлекаем ID из результата (Drizzle возвращает массив)
    const tenderId = result[0].insertedId;

    // 6. ЗАПИСЬ В ЖУРНАЛ АКТИВНОСТИ (Audit Log)
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "TENDER_CREATED",
      targetId: tenderId.toString(), // Теперь переменная tenderId определена
      details: { 
        title: title, 
        price: price,
        category: category 
      }
    });
    
    // Перезагружаем пути, чтобы данные обновились везде
    revalidatePath('/customer/dashboard');
    revalidatePath('/vendor/dashboard');
    revalidatePath('/admin/logs'); // Добавили, чтобы админ сразу видел лог
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error("Ошибка при создании тендера:", error);
    throw new Error("Не удалось создать тендер.");
  }
}

/**
 * Подача отклика на тендер
 */
export async function createBid(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Вы должны быть авторизованы, чтобы подать заявку" };
  }

  const tenderId = Number(formData.get('tenderId'));
  const vendorName = formData.get('vendorName') as string;
  const offerPrice = formData.get('offerPrice') as string;
  const message = formData.get('message') as string;

  try {
    // 1. Сохраняем отклик в базу
    // Используем .returning(), чтобы получить ID созданной заявки (опционально, но полезно для логов)
    const result = await db.insert(bids).values({
      tenderId,
      userId: session.user.id,
      vendorName,
      offerPrice,
      message,
    }).returning({ bidId: bids.id });

    const newBidId = result[0].bidId;

    // 2. ЗАПИСЬ В ЖУРНАЛ АКТИВНОСТИ (Audit Log)
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "BID_PLACED",
      targetId: tenderId.toString(), // Ссылаемся на ID тендера, чтобы админ мог сразу понять, куда упала заявка
      details: { 
        vendor: vendorName, 
        amount: offerPrice,
        bidId: newBidId,
        message: message?.substring(0, 50) + "..." // Сохраняем начало сообщения для превью
      }
    });

    // Обновляем кэш страниц
    revalidatePath('/');
    revalidatePath(`/customer/dashboard/tenders/${tenderId}`);
    revalidatePath('/admin/logs'); // Чтобы админ увидел новый лог
    
    return { success: true };
  } catch (error) {
    console.error("Error creating bid:", error);
    return { error: "Не удалось отправить отклик" };
  }
}

export async function toggleUserBlock(userId: string, currentStatus: boolean) {
  const session = await auth();
  
  // Проверка на админа (чтобы обычный пользователь не мог блокировать других)
  if (session?.user?.role !== 'admin') throw new Error("Forbidden");

  try {
    // 1. Обновляем статус в БД
    await db.update(users)
      .set({ isBlocked: !currentStatus })
      .where(eq(users.id, userId));

    // 2. Логируем действие в журнале активности
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: !currentStatus ? "USER_BLOCKED" : "USER_UNBLOCKED",
      targetId: userId,
      details: { 
        timestamp: new Date().toISOString(),
        status: !currentStatus ? "blocked" : "unblocked"
      }
    });

    // Очищаем кэш страницы пользователей, чтобы изменения сразу отобразились
    revalidatePath('/admin/users');
    revalidatePath('/admin/logs');
    
    return { success: true };
  } catch (error) {
    console.error("Ошибка при смене статуса блокировки:", error);
    return { error: "Ошибка при смене статуса" };
  }
}