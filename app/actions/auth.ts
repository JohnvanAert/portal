'use server'

import { db } from "@/lib/db";
import { users, organizations, auditLogs } from "@/lib/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto"; 
// Библиотеки для парсинга ЭЦП
import * as asn1js from 'asn1js';
import * as pkijs from 'pkijs';

/**
 * ПАРСЕР: Извлекает данные напрямую из сертификата X509
 */
export async function parseCertificateData(certificateBase64: string) {
  try {
    // 1. Декодируем Base64 в ArrayBuffer
    const certBuffer = Buffer.from(certificateBase64, 'base64');
    const arrayBuffer = certBuffer.buffer.slice(
      certBuffer.byteOffset, 
      certBuffer.byteOffset + certBuffer.byteLength
    );

    // 2. Парсим ASN.1 структуру
    const asn1 = asn1js.fromBER(arrayBuffer);
    if (asn1.offset === -1) throw new Error("Ошибка парсинга ASN.1 структуры");

    // 3. Инициализируем структуру Сертификата
    const cert = new pkijs.Certificate({ schema: asn1.result });
    const subject = cert.subject.typesAndValues;

    const result = {
      fio: "",
      iin: "", // Добавляем ИИН для надежности
      bin: "",
      orgName: "",
      email: ""
    };

    // 4. Извлекаем данные из полей сертификата (OID)
    subject.forEach((item: any) => {
      const type = item.type;
      // Более надежный способ извлечения значения для разных типов кодировок
      let value = "";
      try {
        value = item.value.valueBlock.value;
        if (Array.isArray(value)) {
          // Если значение — это массив (случай с вложенными блоками), склеиваем в строку
          value = value.map(v => v.valueBlock?.value || v).join('');
        }
      } catch (e) {
        value = String(item.value.valueBlock.value);
      }

      const strValue = String(value).trim();

      // 2.5.4.3 - CN (ФИО)
      if (type === "2.5.4.3") result.fio = strValue; 
      
      // 2.5.4.11 - OU (Часто здесь ИИН/БИН с префиксами)
      if (type === "2.5.4.11") { 
        if (strValue.includes('BIN')) result.bin = strValue.replace('BIN', '');
        if (strValue.includes('IIN')) result.iin = strValue.replace('IIN', '');
      }

      // 2.5.4.10 - O (Организация)
      if (type === "2.5.4.10") result.orgName = strValue; 
      
      // 2.5.4.5 - SERIALNUMBER (Главный источник ИИН в РК)
      if (type === "2.5.4.5") {
        if (strValue.startsWith('IIN')) {
          result.iin = strValue.replace('IIN', '');
        } else if (strValue.startsWith('BIN')) {
          result.bin = strValue.replace('BIN', '');
        } else if (strValue.length === 12) {
          result.iin = strValue;
        }
      }
    });

    // 5. Попытка найти Email в расширениях (Alternative Name), если в Subject его нет
    if (!result.email && cert.extensions) {
      for (const ext of cert.extensions) {
        if (ext.extnID === "2.5.29.17") { // Subject Alternative Name
          // Это сложная структура, но иногда там просто строка
          try {
            const altNames = ext.extnValue.valueBlock.value;
            // Простейший поиск строки похожей на email
            const emailMatch = String.fromCharCode(...new Uint8Array(altNames)).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) result.email = emailMatch[0];
          } catch (e) { /* ignore */ }
        }
      }
    }

    if (!result.fio) throw new Error("Не удалось извлечь ФИО из ключа");

    // Если email всё еще пуст, но нам нужно войти, 
    // мы можем использовать IIN@b-portal.kz как временный ID, 
    // но лучше требовать email при регистрации.
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Критическая ошибка парсинга:", error);
    return { error: "Не удалось разобрать сертификат. Убедитесь, что выбрали верный ключ (AUTH_RSA или GOST)." };
  }
}

/**
 * Регистрация пользователя в БД
 * Исправлено: Транзакции заменены на последовательные запросы для Neon HTTP
 */
export async function registerWithEDS(edsData: any, password: string, manualEmail?: string) {
  const { fio, email, bin, orgName, iin } = edsData;
  const finalEmail = manualEmail || edsData.email;
  try {
    const existingUser = await db.query.users.findFirst({
      where: iin ? eq(users.iin, iin) : eq(users.email, finalEmail),
    });

    if (existingUser) {
      return { error: `Пользователь уже существует` };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    // 1. Создаем пользователя
    await db.insert(users).values({
      id: userId,
      email: finalEmail,
      iin: iin || null,
      name: fio,
      password: hashedPassword,
      role: 'vendor',
    });

    // 2. Создаем организацию (СВЯЗЫВАЕМ С ПОЛЬЗОВАТЕЛЕМ)
    await db.insert(organizations).values({
      name: orgName || `ИП ${fio}`,
      bin: bin || null,
      userId: userId, 
    });

    await db.insert(auditLogs).values({
      userId: userId,
      action: "USER_REGISTERED",
      details: { fio, iin, bin, orgName }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Registration Error:", error);
    return { error: "Ошибка при сохранении в базу данных." };
  }
}

/**
 * Авторизация через ЭЦП
 */
export async function loginWithEDS(edsData: any) {
  const { iin, email } = edsData;

  try {
    // Ищем пользователя с подтягиванием данных организации
    const user = await db.query.users.findFirst({
      where: iin ? eq(users.iin, iin) : eq(users.email, email),
      with: {
        organization: true, // Это магическая строка Drizzle, которая делает JOIN
      },
    });

    if (!user) {
      return { 
        error: `Пользователь с ИИН ${iin || email} не найден. Пройдите регистрацию.` 
      };
    }

    // Возвращаем данные для сессии, "сплющивая" структуру для NextAuth
    return { 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role,
        // Вытаскиваем данные из вложенного объекта организации
        bin: user.organization?.bin || null,
        companyName: user.organization?.name || null
      } 
    };
  } catch (error) {
    console.error("EDS Login Error:", error);
    return { error: "Ошибка сервера при проверке ЭЦП." };
  }
}

export async function registerRegular(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password || !name) {
      return { error: "Все поля обязательны для заполнения" };
    }

    // 1. Проверяем, существует ли пользователь
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: "Пользователь с таким Email уже существует" };
    }

    // 2. Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Создаем пользователя (по умолчанию роль vendor)
    await db.insert(users).values({
      id: crypto.randomUUID(),
      name,
      email,
      password: hashedPassword,
      role: 'vendor', // По умолчанию регистрируем как поставщика
    });

    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: "Произошла ошибка при регистрации" };
  }
}