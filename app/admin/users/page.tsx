import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { updateUserRole, toggleUserBlock } from "@/app/actions/admin";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Lock, Unlock, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { count, ilike, or, and, eq } from "drizzle-orm";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string; 
    query?: string; 
    role?: string; 
    status?: string 
  }>; // Теперь это Promise
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/");

  // Next.js 15: Обязательно "разворачиваем" searchParams через await
  const sp = await searchParams;
  
  const page = Number(sp.page) || 1;
  const query = sp.query || "";
  const roleFilter = sp.role || "";
  const statusFilter = sp.status || "";
  
  const limit = 10;
  const offset = (page - 1) * limit;

  // Формируем условия фильтрации
  const filters = [];
  
  if (query) {
    filters.push(or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`)));
  }
  
  if (roleFilter) {
    filters.push(eq(users.role, roleFilter as "admin" | "customer" | "vendor"));
  }
  
  if (statusFilter) {
    filters.push(eq(users.isBlocked, statusFilter === "blocked"));
  }

  const whereCondition = filters.length > 0 ? and(...filters) : undefined;

  // 1. Получаем данные
  const allUsers = await db.query.users.findMany({
    where: whereCondition,
    limit: limit,
    offset: offset,
    with: { organization: true },
    orderBy: (users, { desc }) => [desc(users.id)],
  });

  // 2. Считаем количество
  const [totalResult] = await db
    .select({ value: count() })
    .from(users)
    .where(whereCondition);
    
  const totalUsers = totalResult.value;
  const totalPages = Math.ceil(totalUsers / limit);

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Админ-панель</h1>
          <p className="text-slate-500 font-medium mt-2">Управление доступом ({totalUsers})</p>
        </div>
      </div>

      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <form className="flex-1 flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              name="query"
              defaultValue={query}
              placeholder="Поиск по имени или email..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <select 
            name="role" 
            defaultValue={roleFilter}
            className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все роли</option>
            <option value="admin">Админы</option>
            <option value="customer">Заказчики</option>
            <option value="vendor">Поставщики</option>
          </select>

          <select 
            name="status" 
            defaultValue={statusFilter}
            className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Любой статус</option>
            <option value="active">Активные</option>
            <option value="blocked">Заблокированные</option>
          </select>

          <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all">
            Применить
          </button>
          
          {(query || roleFilter || statusFilter) && (
            <Link href="/admin/users" className="text-sm font-bold text-slate-400 hover:text-slate-600 px-2">
              Сброс
            </Link>
          )}
        </form>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 text-xs font-black uppercase text-slate-400">Сотрудник</th>
              <th className="p-6 text-xs font-black uppercase text-slate-400">Email</th>
              <th className="p-6 text-xs font-black uppercase text-slate-400">Текущая роль</th>
              <th className="p-6 text-xs font-black uppercase text-slate-400 text-center">Действие</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.length > 0 ? (
              allUsers.map((user: any) => (
                <tr key={user.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors ${user.isBlocked ? 'bg-red-50/10' : ''}`}>
                  <td className="p-6">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.organization?.name || "Личный аккаунт"}</div>
                  </td>
                  <td className="p-6 text-sm text-slate-600 font-medium">{user.email}</td>
                  <td className="p-6">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {user.role === 'admin' ? 'Администратор' : user.role === 'customer' ? 'Заказчик' : 'Поставщик'}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                     <div className="flex items-center justify-center gap-4">
                      <form action={async () => {
                        'use server'
                        const nextRole = user.role === 'vendor' ? 'customer' : 'vendor';
                        await updateUserRole(user.id, nextRole);
                      }}>
                        <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                          {user.role === 'vendor' ? 'В Заказчики' : 'В Поставщики'}
                        </button>
                      </form>

                      <form action={async () => {
                        'use server'
                        await toggleUserBlock(user.id, !!user.isBlocked);
                      }}>
                        <button className={`p-2 rounded-xl transition-all ${user.isBlocked ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:text-red-500"}`}>
                          {user.isBlocked ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-20 text-center text-slate-400 font-medium">
                  Пользователи не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500 font-medium">
              Страница {page} из {totalPages}
            </div>
            <div className="flex gap-2">
              <Link 
                href={{ query: { ...sp, page: Math.max(1, page - 1) } }}
                className={`p-2 rounded-xl border border-slate-200 ${page <= 1 ? "opacity-30 pointer-events-none" : "bg-white"}`}
              >
                <ChevronLeft size={20} />
              </Link>
              <Link 
                href={{ query: { ...sp, page: Math.min(totalPages, page + 1) } }}
                className={`p-2 rounded-xl border border-slate-200 ${page >= totalPages ? "opacity-30 pointer-events-none" : "bg-white"}`}
              >
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}