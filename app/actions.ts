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
  
  // Получаем файлы
  const files = formData.getAll('documents') as File[];

  try {
    const uploadedUrls: string[] = [];

    // --- ЛОГИКА VERCEL BLOB ---
    for (const file of files) {
      if (file.size === 0) continue;

      // Загружаем файл напрямую в Vercel Storage
      const blob = await put(`bids/${Date.now()}-${file.name}`, file, {
        access: 'public', // Файлы будут доступны по прямой ссылке
      });

      uploadedUrls.push(blob.url); // Сохраняем полученную ссылку
    }

    // 1. Сохраняем отклик в базу данных
    const result = await db.insert(bids).values({
      tenderId,
      userId: session.user.id,
      vendorName,
      offerPrice,
      message,
      // Сохраняем массив ссылок из Vercel Blob
      documents: uploadedUrls, 
    }).returning({ bidId: bids.id });

    const newBidId = result[0].bidId;

    // 2. ЖУРНАЛ АКТИВНОСТИ
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "BID_PLACED",
      targetId: tenderId.toString(),
      details: { 
        vendor: vendorName, 
        amount: offerPrice,
        filesCount: uploadedUrls.length,
        bidId: newBidId
      }
    });

    revalidatePath(`/customer/dashboard/tenders/${tenderId}`);
    revalidatePath(`/tenders/${tenderId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Vercel Blob Upload Error:", error);
    return { error: "Ошибка при загрузке документов в облако" };
  }
}