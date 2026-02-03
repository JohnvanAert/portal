// /auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { loginWithEDS } from "@/app/actions/auth" // Импортируем вашу функцию

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
        // Поля для авторизации через ЭЦП
        iin: { type: "text" },
        isEds: { type: "text" }
      },
      async authorize(credentials) {
        // Приведение типов для доступа к произвольным полям credentials
        const creds = credentials as Record<string, string | undefined>;

        // --- ЛОГИКА ЭЦП ---
        if (creds?.isEds === "true") {
          console.log("🔐 Вход через ЭЦП, ИИН:", creds.iin);
          
          const result = await loginWithEDS({ 
            iin: creds.iin 
          });

          if (result.success && result.user) {
            console.log("✅ Пользователь найден по ИИН");
            // Возвращаем объект, принудительно приводя к типу any, 
            // чтобы избежать конфликта из-за поля role: null
            return { 
              id: result.user.id, 
              name: result.user.name, 
              email: result.user.email, 
              role: result.user.role 
            } as any;
          }
          
          console.error("❌ Ошибка входа по ЭЦП:", result?.error);
          return null; 
        }

        // --- ЛОГИКА EMAIL/PASSWORD ---
        console.log("📧 Обычный вход по Email:", creds?.email);

        if (!creds?.email || !creds?.password) return null;
        
        const user = await db.query.users.findFirst({
          where: eq(users.email, creds.email),
        });

        // Проверка существования пользователя и наличия хэша пароля
        if (!user || !user.password) {
          console.log("Пользователь не найден или пароль не установлен");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          creds.password,
          user.password
        );

        if (!isPasswordValid) {
          console.log("Неверный пароль");
          return null;
        }

        // Возвращаем данные пользователя для JWT сессии
        return { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role || "vendor" 
        } as any;
      },
    }),
  ],
  // ... ваши callbacks остаются без изменений
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.name = user.name;
      }
      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
})