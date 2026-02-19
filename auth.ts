// /auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users, auditLogs } from "@/lib/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { loginWithEDS } from "@/app/actions/auth" 
import { headers } from "next/headers"

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
        // В новых версиях Next.js headers() возвращает Promise
        const headerList = await headers();
        const ip = headerList.get("x-forwarded-for")?.split(',')[0] || "unknown";
        
        const creds = credentials as Record<string, string | undefined>;

        // --- ЛОГИКА ЭЦП ---
        if (creds?.isEds === "true") {
          const result = await loginWithEDS({ iin: creds.iin });

          if (result.success && result.user) {
            // ПРОВЕРКА БЛОКИРОВКИ (ЭЦП)
            if ((result.user as any).isBlocked) {
              await db.insert(auditLogs).values({
                userId: result.user.id,
                action: "LOGIN_ATTEMPT_BLOCKED",
                details: { ip, method: "EDS", reason: "Account blocked" }
              });
              return null; 
            }

            return { 
              id: result.user.id, 
              name: result.user.name, 
              email: result.user.email, 
              role: result.user.role,
              bin: (result.user as any).bin,
              companyName: (result.user as any).companyName
            } as any;
          }
          return null; 
        }

        // --- ЛОГИКА EMAIL/PASSWORD ---
        if (!creds?.email || !creds?.password) return null;
        
        const user = await db.query.users.findFirst({
          where: eq(users.email, creds.email),
          with: { organization: true },
        });

        if (!user || !user.password) return null;

        // ПРОВЕРКА БЛОКИРОВКИ (EMAIL)
        if (user.isBlocked) {
          await db.insert(auditLogs).values({
            userId: user.id,
            action: "LOGIN_ATTEMPT_BLOCKED",
            details: { ip, method: "Credentials", email: creds.email }
          });
          return null; 
        }

        const isPasswordValid = await bcrypt.compare(creds.password, user.password);

        if (!isPasswordValid) {
          await db.insert(auditLogs).values({
            userId: user.id,
            action: "LOGIN_FAILED",
            details: { ip, reason: "Invalid password" }
          });
          return null;
        }

        return { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role || "vendor",
          bin: user.organization?.bin || null,
          companyName: user.organization?.name || null
        } as any;
      },
    }),
  ],
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userId = (auth?.user as any)?.id;

      // Динамическая проверка блокировки активной сессии
      if (isLoggedIn && userId) {
        const userStatus = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { isBlocked: true }
        });

        if (userStatus?.isBlocked) {
          return false; 
        }
      }

      const role = (auth?.user as any)?.role;

      if (isLoggedIn && nextUrl.pathname === '/') {
        if (role === 'admin') return Response.redirect(new URL('/admin/dashboard', nextUrl));
        if (role === 'customer') return Response.redirect(new URL('/customer/dashboard', nextUrl));
        return Response.redirect(new URL('/vendor', nextUrl));
      }

      const isProtectedPath = 
        nextUrl.pathname.startsWith('/vendor') || 
        nextUrl.pathname.startsWith('/customer') || 
        nextUrl.pathname.startsWith('/admin') ||
        nextUrl.pathname.startsWith('/dashboard');

      if (!isLoggedIn && isProtectedPath) {
        return false;
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.name = user.name;
        token.bin = (user as any).bin;
        token.companyName = (user as any).companyName;
      }
      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).bin = token.bin;
        (session.user as any).companyName = token.companyName;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  logger: {
    error(error) {
      // ИСПРАВЛЕНИЕ ОШИБКИ ts(2367): Приводим к строке для сравнения
      const errorCode = (error as any).code || (error as any).message || String(error);
      
      if (errorCode === "CredentialsSignin" || errorCode.includes("CredentialsSignin")) {
        return;
      }
      console.error(error);
    },
  },
})