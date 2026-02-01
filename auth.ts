import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        return { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role || "vendor" 
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. При первой авторизации записываем данные в токен
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.name = user.name
      }

      // 2. ОБНОВЛЕНИЕ: Когда вызывается update() на клиенте
      // Мы проверяем session.user.name, так как именно эту структуру ты шлешь из формы
      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // Переносим данные из токена (включая обновленное имя) в объект сессии
        (session.user as any).role = token.role as string
        (session.user as any).id = token.id as string
        session.user.name = token.name as string 
      }
      return session
    },
  },
  session: { strategy: "jwt" },
})