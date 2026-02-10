// /auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { loginWithEDS } from "@/app/actions/auth" 

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
        iin: { type: "text" },
        isEds: { type: "text" }
      },
      async authorize(credentials) {
        const creds = credentials as Record<string, string | undefined>;

        // --- ЛОГИКА ЭЦП ---
        if (creds?.isEds === "true") {
          console.log("🔐 Вход через ЭЦП, ИИН:", creds.iin);
          
          const result = await loginWithEDS({ 
            iin: creds.iin 
          });

          if (result.success && result.user) {
            console.log("✅ Пользователь найден по ИИН");
            return { 
              id: result.user.id, 
              name: result.user.name, 
              email: result.user.email, 
              role: result.user.role,
              // Добавляем поля организации из результата поиска по ЭЦП
              bin: (result.user as any).bin,
              companyName: (result.user as any).companyName
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
          with: {
            organization: true, // Тянем данные из связанной таблицы organizations
          },
        });

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

        // Возвращаем полные данные пользователя для JWT сессии
        return { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role || "vendor",
          bin: user.organization?.bin || null,
          companyName: user.organization?.name || null // Добавлено: тянем из БД
        } as any;
      },
    }),
  ],
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;

      if (isLoggedIn && nextUrl.pathname === '/') {
        if (role === 'admin') return Response.redirect(new URL('/admin/dashboard', nextUrl));
        if (role === 'customer') return Response.redirect(new URL('/customer/dashboard', nextUrl));
        return Response.redirect(new URL('/vendor', nextUrl));
      }

      if (!isLoggedIn && (nextUrl.pathname.startsWith('/vendor') || nextUrl.pathname.startsWith('/dashboard'))) {
        return false;
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // При первом входе записываем всё в токен
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.name = user.name;
        token.bin = (user as any).bin;           // Сохраняем BIN в токене
        token.companyName = (user as any).companyName; // Сохраняем название в токене
      }
      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }
      return token;
    },

    async session({ session, token }) {
      // Передаем данные из токена в объект сессии, доступный на фронтенде
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        // Теперь в сессии будет вложенный объект
        (session.user as any).organization = token.organization;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
})