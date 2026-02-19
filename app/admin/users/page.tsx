import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { updateUserRole, toggleUserBlock } from "@/app/actions/admin"; // Импортируем оба экшена
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Lock, Unlock } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  
  // Защита страницы: если не админ, отправляем на главную
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db.query.users.findMany({
    with: {
      organization: true 
    }
  });

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Админ-панель</h1>
          <p className="text-slate-500 font-medium mt-2">Управление доступом сотрудников холдинга</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 text-xs font-black uppercase text-slate-400">Сотрудник / Организация</th>
              <th className="p-6 text-xs font-black uppercase text-slate-400">Email</th>
              <th className="p-6 text-xs font-black uppercase text-slate-400">Текущая роль</th>
              <th className="p-6 text-xs font-black uppercase text-slate-400 text-center">Действие</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user: any) => (
              <tr key={user.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors ${user.isBlocked ? 'bg-red-50/30' : ''}`}>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    {user.isBlocked && (
                      <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-black">Blocked</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{user.organization?.name || "Личный аккаунт"}</div>
                </td>
                <td className="p-6 text-sm text-slate-600 font-medium">{user.email}</td>
                <td className="p-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {user.role === 'admin' ? 'Администратор' : 
                    user.role === 'customer' ? 'Заказчик' : 'Поставщик'}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-center gap-4">
                    {/* Смена роли */}
                    <form action={async () => {
                      'use server'
                      const nextRole = user.role === 'vendor' ? 'customer' : 'vendor';
                      await updateUserRole(user.id, nextRole);
                    }}>
                      <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                        Назначить {user.role === 'vendor' ? 'Заказчиком' : 'Поставщиком'}
                      </button>
                    </form>

                    {/* Блокировка профиля */}
                    <form action={async () => {
                      'use server'
                      await toggleUserBlock(user.id, !!user.isBlocked);
                    }}>
                      <button 
                        title={user.isBlocked ? "Разблокировать" : "Заблокировать"}
                        className={`p-2 rounded-xl transition-all ${
                          user.isBlocked 
                            ? "bg-red-100 text-red-600 hover:bg-red-200" 
                            : "bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        }`}
                      >
                        {user.isBlocked ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}