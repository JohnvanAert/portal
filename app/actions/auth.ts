'use server'

import { db } from "@/lib/db";
import { users, organizations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as 'admin' | 'vendor';

  try { 
    // 1. Проверяем, существует ли уже такой email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: "Этот email уже занят" };
    }

    // 2. Хэшируем пароль (чтобы auth.ts мог его потом сравнить)
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // 3. Создаем пользователя
    await db.insert(users).values({
      id: userId,
      email,
      name,
      password: hashedPassword,
      role: role || 'vendor',
    });

    // 4. Если это поставщик, создаем для него пустую запись организации
    if (role === 'vendor') {
      await db.insert(organizations).values({
        name: `Компания ${name}`,
        userId: userId,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Произошла ошибка при регистрации" };
  }
}