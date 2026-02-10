import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Расширяем объект Session, чтобы TypeScript видел роль
   */
  interface Session {
    user: {
      id: string
      role?: string
      organization?: {
        name: string | null
        bin: string | null
      }
    } & DefaultSession["user"]
  }

  /**
   * Расширяем объект User (возвращаемый из authorize)
   */
  interface User {
    id?: string
    role?: string | null
  }
}

declare module "next-auth/jwt" {
  /**
   * Расширяем JWT, чтобы роль сохранялась между запросами
   */
  interface JWT {
    id?: string
    role?: string | null
  }
}