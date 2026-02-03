import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Если не админ — выкидываем на страницу входа или главную
  if (!session || session.user.role !== "admin") {
    redirect("/admin/login"); 
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Боковая панель (Sidebar) */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h2 className="text-xl font-bold mb-10">B-Portal Admin</h2>
        <nav className="space-y-4">
          <a href="/admin/users" className="block hover:text-blue-400 font-medium">Пользователи</a>
          <a href="/admin/logs" className="block hover:text-blue-400 font-medium">Логи активности</a>
          <hr className="border-slate-800" />
          <a href="/api/auth/signout" className="block text-red-400 text-sm">Выйти</a>
        </nav>
      </aside>

      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
}