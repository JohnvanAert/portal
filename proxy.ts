import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role // Получаем роль из сессии

  const isOnDashboard = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/dashboard")
  const isOnLoginPage = nextUrl.pathname.startsWith("/login")

  // 1. Если залогинен и пытается зайти на /login
  if (isOnLoginPage && isLoggedIn) {
    // Редиректим в зависимости от роли, чтобы не попасть в тупик
    const destination = userRole === "admin" ? "/admin/dashboard" : "/"
    return NextResponse.redirect(new URL(destination, nextUrl))
  }

  // 2. Защита админ-панели
  if (isOnDashboard) {
    if (!isLoggedIn) {
      // Не залогинен — на вход
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
    if (userRole !== "admin") {
      // Залогинен, но не админ (Подрядчик) — гоним на главную витрину
      // Это предотвратит бесконечный редирект на /login
      return NextResponse.redirect(new URL("/", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  // Исключаем системные пути
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}