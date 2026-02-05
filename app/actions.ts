'use server'

import { db } from '@/lib/db';
import { tenders, bids } from '@/lib/schema';
import { revalidatePath } from 'next/cache';
import { auth } from "@/auth";
import { put } from '@vercel/blob';

/**
 * Создание нового тендера
 */
export async function createTender(formData: FormData) {
  // 1. Текстовые данные
  const title = formData.get('title') as string;
  const price = formData.get('price') as string;
  const category = formData.get('category') as string;
  const subCategory = formData.get('subCategory') as string;
  const workType = formData.get('workType') as string;
  
  const requirementsRaw = formData.get('requirements') as string;
  const requirements = requirementsRaw ? JSON.parse(requirementsRaw) : [];

  // 2. Файлы из FormData (должны совпадать с именами в модалке)
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

    // 5. Сохранение в БД
    // ВНИМАНИЕ: Убедись, что в схеме есть поля volumeUrl и volumeName. 
    // Если их нет, пока сохрани в attachmentUrl (смету), а объемы добавь позже.
    await db.insert(tenders).values({ 
      title, 
      price, 
      category,      
      subCategory,   
      workType,      
      requirements, 
      attachmentUrl,   
      attachmentName,
      // volumeUrl,   // Раскомментируй, когда добавишь в схему
      // volumeName,  // Раскомментируй, когда добавишь в схему
      status: "Активен" 
    });
    
    revalidatePath('/customer/dashboard');
    revalidatePath('/vendor/dashboard');
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
    await db.insert(bids).values({
      tenderId,
      userId: session.user.id,
      vendorName,
      offerPrice,
      message,
    });

    revalidatePath('/');
    revalidatePath(`/customer/dashboard/tenders/${tenderId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error creating bid:", error);
    return { error: "Не удалось отправить отклик" };
  }
}