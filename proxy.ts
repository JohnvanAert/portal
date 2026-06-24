// C:\Users\User\Desktop\portal\procurement-portal\proxy.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export default auth(async (req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userId = req.auth?.user?.id
  const userRole = req.auth?.user?.role

  const isOnLoginPage = nextUrl.pathname.startsWith("/login")
  const isOnRegisterPage = nextUrl.pathname.startsWith("/register")
  const isAtRoot = nextUrl.pathname === "/"
  const isOnAdminArea = nextUrl.pathname.startsWith("/admin")
  const isBlockedPage = nextUrl.pathname === "/blocked"
  const isApi = nextUrl.pathname.startsWith("/api")

  // ОПТИМИЗАЦИЯ: Проверяем блокировку только для HTML-запросов (переходы по страницам)
  const isPageRequest = req.headers.get("accept")?.includes("text/html")

  // --- 1. ПРОВЕРКА БЛОКИРОВКИ ---
  if (isLoggedIn && userId && isPageRequest && !isApi) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId as string),
        columns: { isBlocked: true },
      });

      // Если пользователь заблокирован и он не на странице /blocked
      if (user?.isBlocked && !isBlockedPage) {
        return NextResponse.redirect(new URL("/blocked", nextUrl));
      }

      // Если пользователь НЕ заблокирован, но пытается зайти на /blocked
      if (!user?.isBlocked && isBlockedPage) {
        return NextResponse.redirect(new URL("/", nextUrl));
      }
    } catch (e) {
      console.error("Ошибка проверки блокировки в proxy:", e);
    }
  }

  // --- 2. ЛОГИКА РЕДИРЕКТОВ ИЗ КОММИТА ---

  // Если залогинен и пытается зайти на страницы входа/регистрации
  if ((isOnLoginPage || isOnRegisterPage) && isLoggedIn) {
    const destination = userRole === "admin" ? "/admin/dashboard" : "/"
    return NextResponse.redirect(new URL(destination, nextUrl))
  }

  // Если АДМИН зашел на главную (корневую) страницу
  if (isAtRoot && isLoggedIn && userRole === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", nextUrl))
  }

  // Защита админ-панели
  if (isOnAdminArea) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  // Исключаем системные файлы Next.js, чтобы прокси не замедлял их загрузку
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}