import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  const isOnLoginPage = nextUrl.pathname.startsWith("/login")
  const isOnRegisterPage = nextUrl.pathname.startsWith("/register")
  const isAtRoot = nextUrl.pathname === "/"
  const isOnAdminArea = nextUrl.pathname.startsWith("/admin")

  // 1. Если залогинен и пытается зайти на страницы входа/регистрации
  if ((isOnLoginPage || isOnRegisterPage) && isLoggedIn) {
    const destination = userRole === "admin" ? "/admin/dashboard" : "/"
    return NextResponse.redirect(new URL(destination, nextUrl))
  }

  // 2. Если АДМИН зашел на главную (корневую) страницу
  // Это уберет пустой экран без сайдбара, который ты видел
  if (isAtRoot && isLoggedIn && userRole === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", nextUrl))
  }

  // 3. Защита админ-панели
  if (isOnAdminArea) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
    if (userRole !== "admin") {
      // Если обычный юзер лезет в админку — возвращаем на витрину
      return NextResponse.redirect(new URL("/", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}